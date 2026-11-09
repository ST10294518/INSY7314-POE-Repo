// Documentation references added during final review (9 November 2026).
// JWT: https://github.com/auth0/node-jsonwebtoken
// CRYPTO: https://nodejs.org/api/crypto.html
// MONG: https://mongoosejs.com/docs/guide.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const { digestToken, isRevoked } = require('../services/authSecurity');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.slice(7).trim();
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  if (
    !decoded ||
    typeof decoded !== 'object' ||
    typeof decoded.id !== 'string' ||
    !Number.isSafeInteger(decoded.exp) || decoded.exp <= Math.floor(Date.now() / 1000) ||
    !mongoose.isObjectIdOrHexString(decoded.id)
  ) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  try {
    const tokenDigest = digestToken(token);
    if (await isRevoked(tokenDigest)) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.user = user;
    req.auth = { tokenDigest, expiresAt: new Date(decoded.exp * 1000) };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = protect;
