// Documentation references added during final review (9 November 2026).
// MONG: https://mongoosejs.com/docs/guide.html
// BCRYPT: https://github.com/dcodeIO/bcrypt.js
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lastFailedLoginAt: { type: Date, default: null, select: false },
    lockUntil: { type: Date, default: null, select: false },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      default: 'client',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeUser = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
