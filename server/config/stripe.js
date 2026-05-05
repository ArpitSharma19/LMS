let stripeInstance = null;

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY is missing');
}

export async function getStripe() {
  if (!stripeInstance) {
    const Stripe = (await import('stripe')).default;
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
}
