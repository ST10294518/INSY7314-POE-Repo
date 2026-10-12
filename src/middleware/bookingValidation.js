
const mongoose = require('mongoose');

function validateBooking(req, res, next) {
  const body = req.body;

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return res.status(400).json({
      message: 'A valid booking request is required.',
    });
  }

  const keys = Object.keys(body);

  // Only the selected Gig ID may be submitted.
  const unexpectedFields = keys.filter(
    (key) => key !== 'gigId'
  );

  if (unexpectedFields.length > 0) {
    return res.status(400).json({
      message: 'Booking contains unsupported fields.',
    });
  }

  if (
    typeof body.gigId !== 'string' ||
    !/^[a-fA-F0-9]{24}$/.test(body.gigId) ||
    !mongoose.isValidObjectId(body.gigId)
  ) {
    return res.status(400).json({
      message: 'A valid Gig ID is required.',
    });
  }

  // Normalise the identifier.
  req.body.gigId = body.gigId.toLowerCase();

  return next();
}

module.exports = validateBooking;
