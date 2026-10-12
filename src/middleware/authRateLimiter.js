
const { rateLimit } = require('express-rate-limit');

// Protect login against repeated password attempts.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  statusCode: 429,
  message: {
    message:
      'Too many login attempts. Please try again in 15 minutes.',
  },
});

// Protect registration against excessive account creation.
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: 429,
  message: {
    message:
      'Too many registration attempts. Please try again later.',
  },
});

module.exports = {
  loginRateLimiter,
  registerRateLimiter,
};
