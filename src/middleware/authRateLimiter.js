// Adapted using express-rate-limit documentation and OWASP login-throttling guidance.
// AI-assisted implementation: OpenAI ChatGPT, 8 November 2026. See README attribution.
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { createHash } = require('node:crypto');
const options = { standardHeaders: 'draft-8', legacyHeaders: false, statusCode: 429 };
// Broad network ceiling: separate from the tighter account failure budget.
const loginIpRateLimiter = rateLimit({
  ...options, windowMs: 15 * 60 * 1000, limit: 200,
  message: { message: 'Too many login attempts from this network. Please try again later.' },
});
// Use AFTER loginRules/handleValidationErrors so email is normalized exactly as login.
const loginRateLimiter = rateLimit({
  ...options, windowMs: 15 * 60 * 1000, limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    if (typeof req.body?.email === 'string' && req.body.email.length <= 254) {
      return 'account:' + createHash('sha256').update(req.body.email).digest('hex');
    }
    return 'missing-email:' + ipKeyGenerator(req.ip);
  },
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});
const registerRateLimiter = rateLimit({
  ...options, windowMs: 60 * 60 * 1000, limit: 10,
  message: { message: 'Too many registration attempts. Please try again later.' },
});
module.exports = { loginRateLimiter, loginIpRateLimiter, registerRateLimiter };
