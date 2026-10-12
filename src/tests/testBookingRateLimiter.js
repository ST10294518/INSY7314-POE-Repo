
const assert = require('node:assert/strict');
const express = require('express');

const bookingRateLimiter = require('../middleware/bookingRateLimiter');

async function runTests() {
  const app = express();

  // Keep proxy trust disabled for local testing.
  app.set('trust proxy', false);

  // Temporary test endpoint protected by the booking limiter.
  app.post('/test-booking', bookingRateLimiter, (req, res) => {
    return res.status(200).json({
      message: 'Booking request accepted.',
    });
  });

  const server = app.listen(0);

  try {
    await new Promise((resolve) => {
      if (server.listening) {
        return resolve();
      }

      server.once('listening', resolve);
    });

    const address = server.address();

    assert.ok(address, 'Test server must be running.');

    const url = `http://127.0.0.1:${address.port}/test-booking`;

    // TEST 1: First 10 booking requests must succeed.
    for (let i = 1; i <= 10; i++) {
      const response = await fetch(url, {
        method: 'POST',
      });

      assert.equal(
        response.status,
        200,
        `Booking request ${i} should return HTTP 200.`
      );

      const body = await response.json();

      assert.equal(
        body.message,
        'Booking request accepted.'
      );
    }

    console.log('PASS: First 10 booking requests accepted.');

    // TEST 2: The 11th request must be rejected.
    const blockedResponse = await fetch(url, {
      method: 'POST',
    });

    assert.equal(
      blockedResponse.status,
      429,
      'The 11th booking request should return HTTP 429.'
    );

    console.log('PASS: 11th request blocked with HTTP 429.');

    // TEST 3: Verify the error response.
    const blockedBody = await blockedResponse.json();

    assert.match(
      blockedBody.message,
      /too many booking requests/i
    );

    console.log('PASS: Appropriate rate-limit message returned.');

    // TEST 4: Verify the rate-limit headers.
    const rateLimitHeader = blockedResponse.headers.get('ratelimit');

    assert.ok(
      rateLimitHeader,
      'RateLimit response header should exist.'
    );

    console.log('PASS: Rate-limit response headers verified.');

    console.log('\nAll booking rate-limiting tests passed.');
  } finally {
    // Close the test server even if an assertion fails.
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }
}

runTests().catch((error) => {
  console.error('Booking rate-limiting test failed:', error);
  process.exitCode = 1;
});
