
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
      index: true,
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },

    bookingDate: {
      type: Date,
      default: Date.now,
    },

    // One unique key per Client booking operation.
    // Optional for compatibility with existing database records.
    idempotencyKey: {
      type: String,
      trim: true,
      minlength: 16,
      maxlength: 128,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

bookingSchema.index({ client: 1, createdAt: -1 });
bookingSchema.index({ freelancer: 1, createdAt: -1 });

// Prevent the same Client from creating two Bookings
// with the same idempotency key.
// Exclude older records that do not contain the key.
bookingSchema.index(
  { client: 1, idempotencyKey: 1 },
  {
    unique: true,
    name: 'unique_client_booking_request',
    partialFilterExpression: {
      idempotencyKey: { $type: 'string' },
    },
  }
);

module.exports =
  mongoose.models.Booking ||
  mongoose.model('Booking', bookingSchema);
