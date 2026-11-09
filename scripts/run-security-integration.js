// Documentation references added during final review (9 November 2026).
// NODETEST: https://nodejs.org/api/test.html
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
// Uses a randomly named isolated database, never the database named in the URI.
require('dotenv').config({ quiet: true });
const { spawn } = require('node:child_process');
const path = require('node:path');
const uri = process.env.SECURITY_TEST_MONGODB_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Set SECURITY_TEST_MONGODB_URI to a test MongoDB deployment or configure MONGODB_URI in .env. Do not paste credentials into chat.');
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, ['--test', 'src/tests/authSecurity.integration.cjs'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, SECURITY_TEST_MONGODB_URI: uri },
    stdio: 'inherit',
  });
  child.on('error', () => { console.error('Could not start security integration tests.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code === 0 ? 0 : 1; });
}
