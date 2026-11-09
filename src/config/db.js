// Documentation references added during final review (9 November 2026).
// MONG: https://mongoosejs.com/docs/guide.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log('MongoDB connected successfully.');
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.name);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

module.exports = connectDB;
