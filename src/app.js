// Documentation references added during final review (9 November 2026).
// EXP: https://expressjs.com/en/5x/api/
// PROXY: https://expressjs.com/en/guide/behind-proxies/
// HELMET: https://helmet.js.org/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

const express = require('express');
const helmet = require('helmet');
const { requestLogger } = require('./middleware/requestLogger');

const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const {
  errorHandler,
  notFound,
} = require('./middleware/errorHandler');

const app = express();

const trustedProxyIp = process.env.TRUSTED_PROXY_IP;
if (trustedProxyIp) {
  app.set('trust proxy', trustedProxyIp);
}

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);

app.use(requestLogger);
app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'HustleHub API is running.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);

// Admin-only routes are deliberately separate.
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
