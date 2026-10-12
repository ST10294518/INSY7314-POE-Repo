
const assert = require('node:assert/strict');
const express = require('express');

const {
  loginRateLimiter,
  registerRateLimiter,
} = require('../middleware/authRateLimiter');

async function runTests() {
  const app = express();

  app.set('trust proxy', false);

  // Mock login endpoint: simulate incorrect passwords.
  app.post('/test-login', loginRateLimiter, (req, res) => {
    res.status(401).json({
      message: 'Invalid credentials.',
    });
  });

  // Mock registration endpoint.
  app.post(
    '/test-register',
    registerRateLimiter,
    (req, res) => {
      res.status(201).json({
        message: 'Registration successful.',
      });
    }
  );

  const server = app.listen(0);

  try {
    await new Promise((resolve) => {
      if (server.listening) return resolve();
      server.once('listening', resolve);
    });

    const address = server.address();

    const baseUrl =
      `http://127.0.0.1:${address.port}`;

    // TEST 1: First five failed login requests.
    for (let i = 1; i <= 5; i++) {
      const response = await fetch(
        `${baseUrl}/test-login`,
        { method: 'POST' }
      );

      assert.equal(response.status, 401);
    }

    console.log(
      'PASS: First 5 failed login attempts processed.'
    );

    // TEST 2: Sixth login attempt blocked.
    const blockedLogin = await fetch(
      `${baseUrl}/test-login`,
      { method: 'POST' }
    );

    assert.equal(blockedLogin.status, 429);

    const loginBody = await blockedLogin.json();

    assert.match(
      loginBody.message,
      /too many login attempts/i
    );

    console.log(
      'PASS: 6th login attempt blocked with HTTP 429.'
    );

    // TEST 3: First ten registrations accepted.
    for (let i = 1; i <= 10; i++) {
      const response = await fetch(
        `${baseUrl}/test-register`,
        { method: 'POST' }
      );

      assert.equal(response.status, 201);
    }

    console.log(
      'PASS: First 10 registrations accepted.'
    );

    // TEST 4: Eleventh registration blocked.
    const blockedRegistration = await fetch(
      `${baseUrl}/test-register`,
      { method: 'POST' }
    );

    assert.equal(blockedRegistration.status, 429);

    const registerBody =
      await blockedRegistration.json();

    assert.match(
      registerBody.message,
      /too many registration attempts/i
    );

    assert.ok(
      blockedRegistration.headers.get('ratelimit')
    );

    console.log(
      'PASS: 11th registration blocked with HTTP 429.'
    );

    console.log(
      'PASS: Error messages and headers verified.'
    );

    console.log(
      'All authentication rate-limiting tests passed.'
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) =>
        error ? reject(error) : resolve()
      );
    });
  }
}

runTests().catch((error) => {
  console.error('Test failed:', error);
  process.exitCode = 1;
});
