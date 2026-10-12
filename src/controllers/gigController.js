const Gig = require('../models/Gig');

function gigInput(body) {
  return {
    title: body.title,
    description: body.description,
    price: body.price,
    category: body.category || '',
  };
}

async function createGig(req, res, next) {
  try {
    const gig = await Gig.create({
      ...gigInput(req.body),
      freelancer: req.user._id,
    });

    return res.status(201).json({
      message: 'Gig created successfully.',
      gig,
    });
  } catch (err) {
    return next(err);
  }
}

async function getGigs(req, res, next) {
  try {
    const gigs = await Gig.find()
      .populate('freelancer', 'email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ gigs });
  } catch (err) {
    return next(err);
  }
}

async function getMyGigs(req, res, next) {
  try {
    const gigs = await Gig.find({ freelancer: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ gigs });
  } catch (err) {
    return next(err);
  }
}

async function getGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('freelancer', 'email');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    return res.status(200).json({ gig });
  } catch (err) {
    return next(err);
  }
}

async function updateGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    if (!gig.freelancer.equals(req.user._id)) {
      return res.status(403).json({
        message: 'You can only update your own gigs.',
      });
    }

    Object.assign(gig, gigInput(req.body));
    await gig.save();

    return res.status(200).json({
      message: 'Gig updated successfully.',
      gig,
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    if (!gig.freelancer.equals(req.user._id)) {
      return res.status(403).json({
        message: 'You can only delete your own gigs.',
      });
    }

    const result = await Gig.deleteOne({
      _id: gig._id,
      freelancer: req.user._id,
    });

    if (result.deletedCount !== 1) {
      return res.status(404).json({ message: 'Gig not found.' });
    }

    return res.status(200).json({ message: 'Gig deleted successfully.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createGig,
  getGigs,
  getMyGigs,
  getGig,
  updateGig,
  deleteGig,
};
