// Documentation references added during final review (9 November 2026).
// JWT: https://github.com/auth0/node-jsonwebtoken
// CRYPTO: https://nodejs.org/api/crypto.html
// MONG: https://mongoosejs.com/docs/guide.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    jwtid: randomUUID(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

module.exports = generateToken;
