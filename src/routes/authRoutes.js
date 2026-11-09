// Documentation references added during final review (9 November 2026).
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

const express = require('express');

const {
  register,
  login,
  getProfile,
  logout,
} = require('../controllers/authController');

const {
  registerRules,
  loginRules,
  handleValidationErrors,
} = require('../middleware/validators');

const {
  loginRateLimiter,
  loginIpRateLimiter,
  registerRateLimiter,
} = require('../middleware/authRateLimiter');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  registerRateLimiter,
  registerRules,
  handleValidationErrors,
  register
);

router.post(
  '/login',
  loginIpRateLimiter,
  loginRules,
  handleValidationErrors,
  loginRateLimiter,
  login
);

router.get('/me', protect, getProfile);
router.post('/logout', protect, logout);

module.exports = router;
