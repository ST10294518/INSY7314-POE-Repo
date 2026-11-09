// Documentation references added during final review (9 November 2026).
// AUTH: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
// BCRYPT: https://github.com/dcodeIO/bcrypt.js
// JWT: https://github.com/auth0/node-jsonwebtoken
// MONG: https://mongoosejs.com/docs/guide.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const security = require('../services/authSecurity');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
// Perform a password hash comparison for unknown/locked accounts too.
const DUMMY_HASH = bcrypt.hashSync('non-user-timing-comparison-value', SALT_ROUNDS);

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

    res.locals.auditActorId = String(user._id);
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
    const user = await User.findOne({ email })
      .select('+passwordHash +failedLoginAttempts +lastFailedLoginAt +lockUntil');
    if (user) res.locals.auditActorId = String(user._id);
    const locked = security.isLocked(user);
    if (locked) res.locals.accountLocked = true;
    const passwordMatches = await bcrypt.compare(
      password, user && !locked ? user.passwordHash : DUMMY_HASH
    );
    if (!user || locked || !passwordMatches) {
      if (user && !locked) await security.recordLoginFailure(user._id);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const authenticated = await security.completeSuccessfulLogin(user);
    if (!authenticated) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    return res.status(200).json({
      message: 'Login successful.',
      user: authenticated.toSafeUser(),
      token: generateToken(authenticated),
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    await security.revokeToken(req.auth);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    return next(err);
  }
}

function getProfile(req, res) {
  return res.status(200).json({ user: req.user.toSafeUser() });
}

module.exports = { register, login, logout, getProfile };
