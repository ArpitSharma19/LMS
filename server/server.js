// Must be the very first import so dotenv loads before database.js and other modules execute
import './config/env.js';

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectDB, sequelize } from "./config/database.js";
import "./models/index.js";

import connectCloudinary from "./config/cloudinary.js";

// Routes
import userRouter from "./routes/userRoutes.js";
import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoute.js";
import chatbotRouter from "./routes/chatbot.routes.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import certificateRouter from "./routes/certificateRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import morgan from 'morgan';
import { commonLimiter } from './middleware/rateLimiter.js';

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
  crossOriginEmbedderPolicy: false, // Required for some external media
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

app.use(morgan('dev'));
app.use('/api', commonLimiter);

// Webhook handling requires raw body (configured inside paymentRouter)
app.use("/api/payment", paymentRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/", (req, res) => {
  res.send("🚀 LMS API Running");
});

app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/certificate", certificateRouter);

app.use(errorMiddleware);

const startServer = async () => {
  try {
    console.log("🚀 Starting LMS Server...");

    await connectDB();

    await sequelize.sync({ alter: false });
    console.log("✅ Database Ready");

    try {
      await connectCloudinary();
      console.log("✅ Cloudinary Connected");
    } catch (err) {
      console.log("❌ Cloudinary Error:", err.message);
    }

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} already in use.`);
        process.exit(1);
      } else {
        console.error("❌ Server Error:", err.message);
      }
    });

  } catch (error) {
    console.error("❌ SERVER START FAILED:", error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
export { startServer };
