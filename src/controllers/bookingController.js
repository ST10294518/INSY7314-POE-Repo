

const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Gig = require('../models/Gig');

function validId(id) {
  return (
    typeof id === 'string' &&
    /^[a-fA-F0-9]{24}$/.test(id)
  );
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        message: `Only ${role} accounts can access this resource.`,
      });
    }

    return next();
  };
}

// Returns a previously completed booking operation.
async function findPreviousBooking(clientId, key) {
  const booking = await Booking.findOne({
    client: clientId,
    idempotencyKey: key,
  });

  if (!booking) {
    return null;
  }

  const transaction = await Transaction.findOne({
    booking: booking._id,
    client: clientId,
  });

  return { booking, transaction };
}

function sendPreviousBooking(res, previous, gigId) {
  if (String(previous.booking.gig) !== gigId) {
    return res.status(409).json({
      message:
        'This idempotency key was already used for another Gig.',
    });
  }

  if (
    previous.booking.status !== 'confirmed' ||
    !previous.transaction ||
    previous.transaction.status !== 'completed'
  ) {
    return res.status(409).json({
      message:
        'This booking operation is not in a completed state.',
    });
  }

  return res.status(200).json({
    message:
      'Booking and simulated payment were already completed.',
    booking: previous.booking,
    transaction: previous.transaction,
    reused: true,
  });
}

// Creates the booking and simulated payment atomically.
async function createBooking(req, res, next) {
  const key = req.get('Idempotency-Key');

  if (
    typeof key !== 'string' ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(key)
  ) {
    return res.status(400).json({
      message:
        'A valid Idempotency-Key header is required (16-128 letters, digits, underscores or hyphens).',
    });
  }

  const clientId = req.user._id;
  const gigId = req.body.gigId;

  let session;

  try {
    // Return an earlier completed operation if this is a retry.
    const previous = await findPreviousBooking(clientId, key);

    if (previous) {
      return sendPreviousBooking(res, previous, gigId);
    }

    session = await mongoose.startSession();

    let createdBooking;
    let createdTransaction;

    await session.withTransaction(async () => {
      const gig = await Gig.findById(gigId).session(session);

      if (!gig) {
        const error = new Error('Gig not found.');
        error.statusCode = 404;
        throw error;
      }

      const [booking] = await Booking.create(
        [
          {
            client: clientId,
            gig: gig._id,
            freelancer: gig.freelancer,
            price: gig.price,
            status: 'confirmed',
            idempotencyKey: key,
          },
        ],
        { session }
      );

      const [transaction] = await Transaction.create(
        [
          {
            booking: booking._id,
            client: clientId,
            freelancer: gig.freelancer,
            amount: gig.price,
            status: 'completed',
          },
        ],
        { session }
      );

      createdBooking = booking;
      createdTransaction = transaction;
    });

    return res.status(201).json({
      message:
        'Booking and simulated payment completed successfully.',
      booking: createdBooking,
      transaction: createdTransaction,
      reused: false,
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({
        message: err.message,
      });
    }

    // If another request committed the same key first,
    // look up that completed operation.
    if (err.code === 11000) {
      try {
        const previous = await findPreviousBooking(
          clientId,
          key
        );

        if (previous) {
          return sendPreviousBooking(res, previous, gigId);
        }
      } catch (lookupError) {
        return next(lookupError);
      }

      return res.status(409).json({
        message:
          'A booking request with this key is being processed. Retry using the same key.',
      });
    }

    return next(err);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({
      client: req.user._id,
    })
      .populate('gig', 'title description category')
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (err) {
    return next(err);
  }
}

async function getFreelancerBookings(req, res, next) {
  try {
    const bookings = await Booking.find({
      freelancer: req.user._id,
    })
      .populate('gig', 'title description category')
      .populate('client', 'email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (err) {
    return next(err);
  }
}

async function getBooking(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid Booking ID.',
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('gig', 'title description category');

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    const isClient = booking.client.equals(req.user._id);
    const isFreelancer =
      booking.freelancer.equals(req.user._id);

    if (!isClient && !isFreelancer) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    return res.status(200).json({ booking });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getFreelancerBookings,
  getBooking,
  requireRole,
};
