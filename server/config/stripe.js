import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeKey) {
    console.warn('⚠️ STRIPE_SECRET_KEY is missing. Stripe functionality will fail.');
}

const stripe = new Stripe(stripeKey || 'sk_test_placeholder', {
    apiVersion: '2024-06-20',
});

export default stripe;
