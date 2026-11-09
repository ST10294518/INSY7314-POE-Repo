// References: OWASP Authentication Cheat Sheet; Mongoose atomic update APIs.
// https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
// https://mongoosejs.com/docs/tutorials/findoneandupdate.html
const { createHash } = require('node:crypto');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const FAILURE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
function digestToken(token) { return createHash('sha256').update(token).digest('hex'); }
function unlockedAt(now) {
  return { $or: [{ lockUntil: { $exists: false } }, { lockUntil: null }, { lockUntil: { $lte: now } }] };
}
function isLocked(user, now = new Date()) {
  return Boolean(user?.lockUntil && new Date(user.lockUntil).getTime() > now.getTime());
}
async function recordLoginFailure(userId, now = new Date()) {
  // The pipeline increments from current DB state, not a stale document snapshot.
  // A locked account is excluded, so blocked requests do not extend its lockout.
  const cutoff = new Date(now.getTime() - WINDOW_MS);
  return User.updateOne({ _id: userId, ...unlockedAt(now) }, [
    { $set: {
      failedLoginAttempts: { $add: [
        { $cond: [
          { $gt: [{ $ifNull: ['$lastFailedLoginAt', new Date(0)] }, cutoff] },
          { $ifNull: ['$failedLoginAttempts', 0] }, 0,
        ] }, 1,
      ] },
      lastFailedLoginAt: now,
    } },
    { $set: { lockUntil: { $cond: [
      { $gte: ['$failedLoginAttempts', FAILURE_LIMIT] },
      new Date(now.getTime() + LOCK_MS), null,
    ] } } },
  ], { updatePipeline: true });
}
async function completeSuccessfulLogin(user, now = new Date()) {
  // Recheck lock and password hash at the write, after the password comparison.
  return User.findOneAndUpdate(
    { _id: user._id, passwordHash: user.passwordHash, ...unlockedAt(now) },
    { $set: { failedLoginAttempts: 0, lastFailedLoginAt: null, lockUntil: null } },
    { returnDocument: 'after' }
  );
}
async function revokeToken(auth) {
  try {
    await RevokedToken.updateOne(
      { tokenDigest: auth.tokenDigest },
      { $setOnInsert: { expiresAt: auth.expiresAt } },
      { upsert: true, runValidators: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}
async function isRevoked(tokenDigest, now = new Date()) {
  return Boolean(await RevokedToken.exists({ tokenDigest, expiresAt: { $gt: now } }));
}
module.exports = { FAILURE_LIMIT, WINDOW_MS, LOCK_MS, digestToken, isLocked,
  recordLoginFailure, completeSuccessfulLogin, revokeToken, isRevoked };
