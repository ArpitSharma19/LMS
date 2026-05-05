import winston from 'winston';

const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: isProd ? 'warn' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  // Console-only: Vercel filesystem is read-only, file transports crash on cold start
  transports: [new winston.transports.Console()],
});

export default logger;
