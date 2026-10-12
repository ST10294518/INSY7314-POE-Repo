
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
