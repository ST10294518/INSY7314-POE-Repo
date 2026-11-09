// Documentation references added during final review (9 November 2026).
// EXP: https://expressjs.com/en/5x/api/
// MONG: https://mongoosejs.com/docs/guide.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const { estimateTax } = require('../utils/taxEstimate');

const Transaction = require('../models/Transaction');

async function getIncome(req, res, next) {
  try {
    const freelancer = req.user._id;

    const results = await Transaction.aggregate([
      {
        $match: {
          freelancer,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' },
          completedTransactions: { $sum: 1 },
        },
      },
    ]);

    const summary = results[0] || {
      totalIncome: 0,
      completedTransactions: 0,
    };

    return res.status(200).json({
      currency: 'ZAR',
      ...estimateTax(summary.totalIncome),
      completedTransactions: summary.completedTransactions,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMyTransactions(req, res, next) {
  try {
    const transactions = await Transaction.find({
      freelancer: req.user._id,
    })
      .populate({
        path: 'booking',
        select: 'gig price status bookingDate',
        populate: {
          path: 'gig',
          select: 'title category',
        },
      })
      .sort({ transactionDate: -1 });

    return res.status(200).json({ transactions });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getIncome,
  getMyTransactions,
};
