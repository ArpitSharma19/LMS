import express from 'express';
import {
  register,
  login,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  applyAsEducator,
  getEducatorStatus,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const authRouter = express.Router();

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/logout', logout);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/verify-otp', authLimiter, verifyOtp);
authRouter.post('/reset-password', authLimiter, resetPassword);
authRouter.post('/change-password', protect, changePassword);
authRouter.get('/me', protect, getMe);

// Educator application (authenticated)
authRouter.post('/educator/apply', protect, applyAsEducator);
authRouter.get('/educator/status', protect, getEducatorStatus);

export default authRouter;
