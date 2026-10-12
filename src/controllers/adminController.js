
const User = require('../models/User');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

function pagination(req) {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);

  const page = Number.isSafeInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), 10000)
    : 1;

  const limit = Number.isSafeInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

async function getOverview(req, res, next) {
  try {
    const [
      totalUsers,
      totalClients,
      totalFreelancers,
      totalGigs,
      totalBookings,
      confirmedBookings,
      completedTransactions,
      income,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'freelancer' }),
      Gig.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      overview: {
        totalUsers,
        totalClients,
        totalFreelancers,
        totalGigs,
        totalBookings,
        confirmedBookings,
        completedTransactions,
        totalSimulatedRevenue: income[0]?.total || 0,
        currency: 'ZAR',
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req);

    const [users, total] = await Promise.all([
      User.find()
        .select('_id email role createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      users,
      pagination: { page, limit, total },
    });
  } catch (error) {
    return next(error);
  }
}

async function getGigs(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req);

    const [gigs, total] = await Promise.all([
      Gig.find()
        .select('_id title category price freelancer createdAt')
        .populate('freelancer', 'email')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Gig.countDocuments(),
    ]);

    return res.status(200).json({
      gigs,
      pagination: { page, limit, total },
    });
  } catch (error) {
    return next(error);
  }
}

async function getBookings(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req);

    const [bookings, total] = await Promise.all([
      Booking.find()
        .select(
          '_id client freelancer gig price status bookingDate createdAt'
        )
        .populate('client', 'email')
        .populate('freelancer', 'email')
        .populate('gig', 'title')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(),
    ]);

    return res.status(200).json({
      bookings,
      pagination: { page, limit, total },
    });
  } catch (error) {
    return next(error);
  }
}

async function getTransactions(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req);

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .select(
          '_id booking client freelancer amount status transactionDate createdAt'
        )
        .populate('client', 'email')
        .populate('freelancer', 'email')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(),
    ]);

    return res.status(200).json({
      transactions,
      pagination: { page, limit, total },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOverview,
  getUsers,
  getGigs,
  getBookings,
  getTransactions,
};
