import { Webhook } from "svix";
import Stripe from "stripe";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// ---------------- CLERK WEBHOOK ----------------
export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    switch (type) {
      case "user.created":
        await User.create({
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
          resume: "",
        });
        break;

      case "user.updated":
        await User.findByIdAndUpdate(data.id, {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
        });
        break;

      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;

      default:
        break;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ---------------- STRIPE INIT ----------------
let stripeInstance = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("⚠️ Stripe disabled: STRIPE_SECRET_KEY missing");
}

// ---------------- STRIPE WEBHOOK ----------------
export const stripeWebhooks = async (req, res) => {
  if (!stripeInstance) {
    return res.status(500).json({ message: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntentId = event.data.object.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchase = await Purchase.findById(purchaseId);
      const user = await User.findById(purchase.userId);
      const course = await Course.findById(purchase.courseId);

      course.enrolledStudents.push(user._id);
      user.enrolledCourses.push(course._id);

      purchase.status = "completed";

      await Promise.all([
        course.save(),
        user.save(),
        purchase.save(),
      ]);

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntentId = event.data.object.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      await Purchase.findByIdAndUpdate(purchaseId, {
        status: "failed",
      });

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
