// Documentation references added during final review (9 November 2026).
// MONG: https://mongoosejs.com/docs/guide.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: (value) =>
          Number.isFinite(value) &&
          /^\d+(\.\d{1,2})?$/.test(String(value)) &&
          Number.isSafeInteger(Math.round(value * 100)),
        message: 'Price must be a positive amount with at most two decimal places.',
      },
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gig', gigSchema);
