import './config/env.js';
import app from './app.js';
import connectCloudinary from "./config/cloudinary.js";

const startServer = async () => {
  try {
    console.log("🚀 Starting LMS Server Locally...");

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

startServer();
