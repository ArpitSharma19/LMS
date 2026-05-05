import logger from '../utils/logger.js';

const HTTP_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Unexpected server error';

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    statusCode = err.statusCode || 402;
    message = err.message;
  }

  // JWT errors (shouldn't reach here normally — handled in authMiddleware, but just in case)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Unauthorized: Invalid or expired token';
  }

  // Multer errors
  if (err.name === 'MulterError' || err.message === 'Unsupported file type') {
    statusCode = 400;
  }

  // Supabase / PostgREST errors surface as plain objects with a `code` property
  if (err.code && typeof err.code === 'string' && err.details) {
    statusCode = 400;
    message = err.message || 'Database error';
  }

  const code = err.code && typeof err.code === 'string' && err.code.length < 30
    ? err.code
    : (HTTP_CODES[statusCode] || 'INTERNAL_ERROR');

  logger.error(`${statusCode} ${req.method} ${req.originalUrl} — ${message}`, {
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  const body = {
    success: false,
    message,
    code,
  };

  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

export default errorMiddleware;
