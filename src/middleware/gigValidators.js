const { body, param } = require('express-validator');
const mongoose = require('mongoose');

function textRule(field, min, max) {
  return body(field)
    .isString().withMessage(`${field} must be a string.`).bail()
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must contain between ${min} and ${max} characters.`)
    .bail()
    .custom((value) => !/[<>\u0000-\u001F\u007F]/.test(value))
    .withMessage(`${field} must be plain text without HTML or control characters.`);
}

const gigRules = [
  body()
    .custom((value) =>
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) =>
        ['title', 'description', 'price', 'category'].includes(key)
      )
    )
    .withMessage('Only title, description, price and category are permitted.'),
  textRule('title', 3, 120),
  textRule('description', 10, 2000),
  body('price')
    .custom((value) =>
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0.01 &&
      /^\d+(\.\d{1,2})?$/.test(String(value)) &&
      Number.isSafeInteger(Math.round(value * 100))
    )
    .withMessage('Price must be a positive JSON number with at most two decimal places.'),
  textRule('category', 0, 80).optional(),
];

const gigIdRules = [
  param('id')
    .custom((value) => mongoose.isObjectIdOrHexString(value))
    .withMessage('A valid Gig ID is required.'),
];

module.exports = { gigRules, gigIdRules };
