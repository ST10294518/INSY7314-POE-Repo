const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const role = req.body.role || 'client';

    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({
        message: 'Role must be either "client" or "freelancer".',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, role });

    return res.status(201).json({
      message: 'Registration successful.',
      user: user.toSafeUser(),
      token: generateToken(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    return res.status(200).json({
      message: 'Login successful.',
      user: user.toSafeUser(),
      token: generateToken(user),
    });
  } catch (err) {
    return next(err);
  }
}

function getProfile(req, res) {
  return res.status(200).json({ user: req.user.toSafeUser() });
}

module.exports = { register, login, getProfile };
