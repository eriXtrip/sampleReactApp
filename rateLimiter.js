// root/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many verification attempts, please try again later'
});