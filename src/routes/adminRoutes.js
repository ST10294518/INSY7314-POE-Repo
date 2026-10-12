
const express = require('express');

const protect = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const {
  getOverview,
  getUsers,
  getGigs,
  getBookings,
  getTransactions,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get('/me', (req, res) => {
  return res.status(200).json({
    message: 'Admin access verified.',
    user: req.user.toSafeUser(),
  });
});

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/gigs', getGigs);
router.get('/bookings', getBookings);
router.get('/transactions', getTransactions);

module.exports = router;
