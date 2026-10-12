
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function provisionAdmin() {
  if (process.env.ADMIN_PROVISION_ENABLED !== 'true') {
    throw new Error(
      'Admin provisioning is disabled. Set ADMIN_PROVISION_ENABLED=true temporarily.'
    );
  }

  const email = (process.env.ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();

  const password = process.env.ADMIN_PASSWORD || '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A valid ADMIN_EMAIL is required.');
  }

  if (
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new Error(
      'Admin password must contain 12-72 UTF-8 bytes.'
    );
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email });

  if (existing) {
    throw new Error(
      'An account with this email already exists. No changes were made.'
    );
  }

  const rounds =
    Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

  const passwordHash = await bcrypt.hash(password, rounds);

  await User.create({
    email,
    passwordHash,
    role: 'admin',
  });

  console.log('Admin account provisioned successfully.');
}

provisionAdmin()
  .catch((error) => {
    console.error('Provisioning failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
