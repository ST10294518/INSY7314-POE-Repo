
const express = require('express');
const protect = require('../middleware/authMiddleware');
const validateBooking = require('../middleware/bookingValidation');
const bookingRateLimiter = require('../middleware/bookingRateLimiter');

const {
  createBooking,
  getMyBookings,
  getFreelancerBookings,
  getBooking,
  requireRole,
} = require('../controllers/bookingController');

const router = express.Router();

// All Booking endpoints require authentication.
router.use(protect);

// Client creates a booking and completes a simulated payment.
router.post(
  '/',
  requireRole('client'),
  bookingRateLimiter,
  validateBooking,
  createBooking
);

// Client's own booking history.
router.get(
  '/mine',
  requireRole('client'),
  getMyBookings
);

// Freelancer's received bookings.
router.get(
  '/freelancer',
  requireRole('freelancer'),
  getFreelancerBookings
);

// Client or Freelancer can view only their own bookings.
router.get('/:id', getBooking);

module.exports = router;
