import express from 'express';
import { createCheckoutSession, stripeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-checkout-session', protect, createCheckoutSession);

// Webhook must NOT use the general 'protect' middleware as it comes from Stripe
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default paymentRouter;
