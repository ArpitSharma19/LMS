import stripe from '../config/stripe.js';
import { supabase } from '../config/supabase.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

export const createCheckoutSession = catchAsync(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (!course) throw new ApiError(404, 'Course not found');

    const price = Math.max(0, parseFloat(((course.courseprice ?? 0) * (1 - (course.discount ?? 0) / 100)).toFixed(2)));

    // 1. If Free Course -> Direct Enrollment
    if (price === 0) {
        const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('userid', userId)
            .eq('courseid', courseId)
            .maybeSingle();
        if (existing) throw new ApiError(400, 'Already enrolled');

        await supabase.from('enrollments').insert([{ userid: userId, courseid: courseId }]);
        return res.json({ success: true, message: 'Enrolled successfully (Free Course)', isFree: true });
    }

    // 2. If Paid Course -> Create Stripe Session
    if (!stripe) throw new ApiError(503, 'Payment service unavailable');

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: course.coursetitle ?? 'Course',
                    description: (course.coursedescription ?? '').substring(0, 100),
                    images: course.coursethumbnail ? [course.coursethumbnail] : [],
                },
                unit_amount: Math.round(price * 100),
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/my-enrollments?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/course/${courseId}?canceled=true`,
        metadata: {
            userId: String(userId),
            courseId: String(courseId),
        },
    });

    // Create a pending purchase record
    await supabase.from('purchases').insert([{
        userid: userId,
        courseid: courseId,
        amount: price,
        stripe_session_id: session.id,
        status: 'pending',
    }]);

    res.json({ success: true, url: session.url });
});

export const stripeWebhook = catchAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    if (!stripe) return res.status(503).json({ message: 'Payment service unavailable' });

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, courseId } = session.metadata;

        try {
            await supabase
                .from('purchases')
                .update({ status: 'completed' })
                .eq('stripe_session_id', session.id);

            const { data: existing } = await supabase
                .from('enrollments')
                .select('id')
                .eq('userid', userId)
                .eq('courseid', courseId)
                .maybeSingle();

            if (!existing) {
                await supabase
                    .from('enrollments')
                    .insert([{ userid: userId, courseid: courseId }]);
            }

            console.log(`✅ Payment successful — User ${userId}, Course ${courseId}`);
        } catch (error) {
            console.error('❌ Webhook Processing Error:', error);
            return res.status(500).json({ message: 'Internal Server Error during webhook processing' });
        }
    }

    res.json({ received: true });
});
