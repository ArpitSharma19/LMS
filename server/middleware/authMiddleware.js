import jwt from 'jsonwebtoken';
import { User, Educator } from '../models/index.js';

// Attach req.auth.userId from JWT — preserves API contract across all controllers
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔍 AUTH DEBUG: Authorization Header:", authHeader);
    
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    console.log("🔍 AUTH DEBUG: Extracted Token:", token ? "Exists (Redacted)" : "MISSING");

    if (!token) {
      console.warn("⚠️ AUTH WARN: No token provided");
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: decoded.id };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized: Authentication failed' });
  }
};

// Optional auth — attaches req.auth.userId if token exists, but doesn't block if not
export const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.auth = { userId: decoded.id };
    }
    next();
  } catch (error) {
    // If token is invalid/expired, we just proceed as guest
    next();
  }
};

// Protect educator routes — user must be logged in AND have active educator profile
export const protectEducator = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Not logged in' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'educator') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Educator access only' });
    }

    const educatorProfile = await Educator.findOne({ where: { userId } });
    if (!educatorProfile || educatorProfile.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Educator account not yet approved' });
    }

    req.auth = { userId };
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};
