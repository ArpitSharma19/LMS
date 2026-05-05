import rateLimit from 'express-rate-limit';

export const commonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const purchaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 purchase requests per hour
  message: {
    success: false,
    message: "Purchase limit exceeded. Please try again after an hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Increased for development
  message: {
    success: false,
    message: "Too many login/register attempts. Please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
