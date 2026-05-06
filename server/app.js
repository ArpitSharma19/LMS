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
import healthRouter from "./routes/healthRoutes.js";
import seedRouter from "./routes/seedRoutes.js";

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

// Build allowed-origins set once at startup.
// FRONTEND_URL is already trailing-slash-stripped by config/env.js.
const ALLOWED_ORIGINS = new Set(
  [
    'https://brainlyft-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,         // covers any custom domain in env
  ].filter(Boolean)
);

const corsOptions = {
  origin: (origin, callback) => {
    // No origin = same-origin request, server-to-server (Stripe webhooks), curl
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'stripe-signature'],
  optionsSuccessStatus: 200, // IE11 chokes on 204
};

// CORS must be first — before rate limiters, routes, and body parsers
app.use(cors(corsOptions));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', commonLimiter);

// Webhook handling (must be before express.json)
app.use("/api/payment", paymentRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.use("/health", healthRouter);

app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/certificate", certificateRouter);
app.use("/api/seed", seedRouter);

// Catch-all 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorMiddleware);

// Production-ready serverless export for Vercel
export default app;
