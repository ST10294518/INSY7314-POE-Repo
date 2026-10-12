const fs = require('fs');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5443;
const KEY_PATH = process.env.SSL_KEY_PATH || './certs/key.pem';
const CERT_PATH = process.env.SSL_CERT_PATH || './certs/cert.pem';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set.');
  process.exit(1);
}

let sslOptions;

try {
  sslOptions = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  };
} catch (err) {
  console.error(
    `FATAL: Could not read SSL key/cert at "${KEY_PATH}" / "${CERT_PATH}". ` +
      'Generate a local certificate before starting the server.'
  );
  process.exit(1);
}

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.error('FATAL: MongoDB connection failed:', err.name);
    process.exit(1);
  }

  const server = https.createServer(sslOptions, app);

  server.on('error', (err) => {
    console.error('FATAL: HTTPS server error:', err.code || err.name);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`HustleHub API listening securely on https://localhost:${PORT}`);
  });
}

startServer();
