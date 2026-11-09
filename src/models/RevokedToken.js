// Reference: OWASP JSON Web Token Cheat Sheet, revocation/denylist guidance.
// https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  tokenDigest: { type: String, required: true, unique: true, minlength: 64, maxlength: 64 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
module.exports = mongoose.model('RevokedToken', schema);
