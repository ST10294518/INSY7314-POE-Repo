// Documentation references added during final review (9 November 2026).
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  getIncome,
  getMyTransactions,
} = require('../controllers/transactionController');
const { requireRole } = require('../controllers/bookingController');

const router = express.Router();

router.use(protect);
router.use(requireRole('freelancer'));

router.get('/income', getIncome);
router.get('/mine', getMyTransactions);

module.exports = router;
