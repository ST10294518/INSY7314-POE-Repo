function requireFreelancer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role !== 'freelancer') {
    return res.status(403).json({
      message: 'Only Freelancers can perform this action.',
    });
  }

  return next();
}

module.exports = requireFreelancer;
