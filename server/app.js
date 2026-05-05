import './config/env.js';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from 'morgan';
import { commonLimiter } from './middleware/rateLimiter.js';
import errorMiddleware from "./middleware/errorMiddleware.js";

// Routes
import userRouter from "./routes/userRoutes.js";
import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoute.js";
import chatbotRouter from "./routes/chatbot.routes.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import certificateRouter from "./routes/certificateRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

import { supabase } from "./config/supabase.js";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube.com", "https://s.ytimg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://api.dicebear.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://vitals.vercel-insights.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, 
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOptions = {
  origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 

app.use(morgan('dev'));
app.use('/api', commonLimiter);

// Webhook handling (must be before express.json)
app.use("/api/payment", paymentRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running"
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("id, name").limit(1);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/certificate", certificateRouter);

// Catch-all 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorMiddleware);

// Export for Vercel Serverless
export default (req, res) => {
  return app(req, res);
};
