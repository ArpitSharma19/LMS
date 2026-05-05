import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, sql: err?.parent?.sql });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Unexpected Server Error";

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors?.map(e => e.message).join(', ') || err.message;
  }

  if (err.message === 'Unsupported file type' || err.name === 'MulterError') {
    statusCode = 400;
  }

  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      sqlError: err.parent?.message
    })
  };

  res.status(statusCode).json(response);
};

export default errorMiddleware;
