let Stripe;

try {
  const stripeModule = await import('stripe');
  Stripe = stripeModule.default;
} catch (err) {
  console.error('Stripe failed to load:', err.message);
}

const stripe = Stripe
  ? new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20',
    })
  : null;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Stripe functionality will be disabled.');
}

export default stripe;
