
const assert = require('node:assert/strict');

const validateBooking = require('../middleware/bookingValidation');

// Simulate an Express request and response.
function runTest(body) {
  const result = {
    status: 200,
    nextCalled: false,
    message: null,
  };

  const req = { body };

  const res = {
    status(code) {
      result.status = code;
      return this;
    },

    json(data) {
      result.message = data.message;
      return this;
    },
  };

  validateBooking(req, res, () => {
    result.nextCalled = true;
  });

  return result;
}

const validId = '507f1f77bcf86cd799439011';

// TEST 1: A valid Gig ID should pass validation.
const validResult = runTest({ gigId: validId });

assert.equal(validResult.nextCalled, true);
assert.equal(validResult.status, 200);

console.log('PASS: Valid Gig ID accepted.');

// TEST 2: Missing Gig ID should be rejected.
assert.equal(runTest({}).status, 400);

console.log('PASS: Missing Gig ID rejected.');

// TEST 3: Invalid Gig ID should be rejected.
assert.equal(
  runTest({ gigId: 'invalid' }).status,
  400
);

console.log('PASS: Invalid Gig ID rejected.');

// TEST 4: Client cannot submit a custom price.
assert.equal(
  runTest({
    gigId: validId,
    price: 1,
  }).status,
  400
);

console.log('PASS: Client-supplied price rejected.');

// TEST 5: Client cannot supply another user's ID.
assert.equal(
  runTest({
    gigId: validId,
    client: 'another-user',
  }).status,
  400
);

console.log('PASS: Client-supplied identity rejected.');

// TEST 6: Null request body should be rejected.
assert.equal(runTest(null).status, 400);

console.log('PASS: Null request body rejected.');

console.log('\nAll 6 booking validation tests passed.');
