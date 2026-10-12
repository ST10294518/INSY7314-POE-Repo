const { body, validationResult } = require('express-validator');

function requestBodyRule(allowedFields) {
  return body()
    .custom((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
      }

      return Object.keys(value).every((key) => allowedFields.includes(key));
    })
    .withMessage('Request must be a JSON object containing only permitted fields.');
}

function emailRule() {
  return body('email')
    .isString().withMessage('Email must be a string.').bail()
    .trim()
    .notEmpty().withMessage('Email is required.').bail()
    .isLength({ max: 254 }).withMessage('Email is too long.').bail()
    .isEmail().withMessage('A valid email address is required.').bail()
    .normalizeEmail();
}

function passwordRule() {
  return body('password')
    .isString().withMessage('Password must be a string.').bail()
    .notEmpty().withMessage('Password is required.').bail()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 UTF-8 bytes.').bail();
}

const registerRules = [
  requestBodyRule(['email', 'password', 'role']),
  emailRule(),
  passwordRule()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.').bail()
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number.'),
  body('role')
    .optional()
    .isString().withMessage('Role must be a string.').bail()
    .isIn(['client', 'freelancer'])
    .withMessage('Role must be either "client" or "freelancer".'),
];

const loginRules = [
  requestBodyRule(['email', 'password']),
  emailRule(),
  passwordRule(),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors.array().map((error) => ({
        field: error.path || 'body',
        message: error.msg,
      })),
    });
  }

  return next();
}

module.exports = { registerRules, loginRules, handleValidationErrors };
