import { getStripe } from '../utils/loaders.js';
import { supabase } from '../config/supabase.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

export const createCheckoutSession = catchAsync(async (req, res) => {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (!course) throw new ApiError(404, 'Course not found');

    const price = Math.max(0, parseFloat((course.course_price * (1 - course.discount / 100)).toFixed(2)));

    // 1. If Free Course -> Direct Enrollment
    if (price === 0) {
        const { data: existing } = await supabase.from('enrollments').select('*').eq('user_id', userId).eq('course_id', courseId).single();
        if (existing) throw new ApiError(400, 'Already enrolled');

        await supabase.from('enrollments').insert([{ user_id: userId, course_id: courseId }]);
        return res.json({ success: true, message: 'Enrolled successfully (Free Course)', isFree: true });
    }

    // 2. If Paid Course -> Create Stripe Session
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: course.course_title,
                    description: (course.course_description || '').substring(0, 100),
                    images: [course.course_thumbnail],
                },
                unit_amount: Math.round(price * 100), // in paisa
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
        user_id: userId,
        course_id: courseId,
        amount: price,
        stripe_session_id: session.id,
        status: 'pending'
    }]);

    res.json({ success: true, url: session.url });
});

export const stripeWebhook = catchAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    const stripe = await getStripe();

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, courseId } = session.metadata;

        try {
            // 1. Update Purchase Status
            await supabase
                .from('purchases')
                .update({ status: 'completed' })
                .eq('stripe_session_id', session.id);

            // 2. Create Enrollment (Idempotent)
            const { data: existing } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .single();

            if (!existing) {
                await supabase
                    .from('enrollments')
                    .insert([{ user_id: userId, course_id: courseId }]);
            }

            console.log(`✅ Payment successful and enrollment created for User ${userId}, Course ${courseId}`);
        } catch (error) {
            console.error('❌ Webhook Processing Error:', error);
            return res.status(500).json({ message: 'Internal Server Error during webhook processing' });
        }
    }

    res.json({ received: true });
});
