import { clerkClient } from "@clerk/express";

// Protect Educator Routes Middleware
export const protectEducator = async (req, res, next) => {
  try {
    // 1️⃣ Check auth exists
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Not logged in",
      });
    }

    const userId = req.auth.userId;

    // 2️⃣ Get user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // 3️⃣ Check educator role
    if (user.publicMetadata?.role !== "educator") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Educator access only",
      });
    }

    // 4️⃣ Attach user for next controllers (optional but useful)
    req.user = user;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
