// Documentation references added during final review (9 November 2026).
// RATE: https://express-rate-limit.mintlify.app/reference/configuration
// AUTH: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

const { rateLimit } = require('express-rate-limit');

const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: 'draft-8',

  legacyHeaders: false,

  message: {
    message:
      'Too many booking requests. Please try again in 15 minutes.',
  },

  statusCode: 429,

  skipFailedRequests: false,
});

module.exports = bookingRateLimiter;
