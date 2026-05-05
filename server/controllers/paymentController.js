import Stripe from 'stripe';
import { Course, User, Purchase, Enrollment, sequelize } from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
});

export const createCheckoutSession = catchAsync(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    const course = await Course.findByPk(courseId);
    if (!course) throw new ApiError(404, 'Course not found');

    const price = Math.max(0, parseFloat((course.coursePrice * (1 - course.discount / 100)).toFixed(2)));

    // 1. If Free Course -> Direct Enrollment
    if (price === 0) {
        const existing = await Enrollment.findOne({ where: { userId, courseId } });
        if (existing) throw new ApiError(400, 'Already enrolled');

        await Enrollment.create({ userId, courseId });
        return res.json({ success: true, message: 'Enrolled successfully (Free Course)', isFree: true });
    }

    // 2. If Paid Course -> Create Stripe Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: course.courseTitle,
                    description: course.courseDescription.substring(0, 100),
                    images: [course.courseThumbnail],
                },
                unit_amount: Math.round(price * 100), // in paisa
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/my-enrollments?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/course/${courseId}?canceled=true`,
        metadata: {
            userId: String(userId),
            courseId: String(courseId),
        },
    });

    // Create a pending purchase record
    await Purchase.create({
        userId,
        courseId,
        amount: price,
        stripe_session_id: session.id,
        status: 'pending'
    });

    res.json({ success: true, url: session.url });
});

export const stripeWebhook = catchAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, courseId } = session.metadata;

        const t = await sequelize.transaction();
        try {
            // 1. Update Purchase Status
            const purchase = await Purchase.findOne({ where: { stripe_session_id: session.id }, transaction: t });
            if (purchase) {
                purchase.status = 'completed';
                await purchase.save({ transaction: t });
            }

            // 2. Create Enrollment (Idempotent)
            await Enrollment.findOrCreate({ 
                where: { userId, courseId },
                transaction: t 
            });

            await t.commit();
            console.log(`✅ Payment successful and enrollment created for User ${userId}, Course ${courseId}`);
        } catch (error) {
            await t.rollback();
            console.error('❌ Webhook Processing Error:', error);
            return res.status(500).json({ message: 'Internal Server Error during webhook processing' });
        }
    }

    res.json({ received: true });
});
