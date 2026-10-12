const express = require('express');
const controller = require('../controllers/gigController');
const protect = require('../middleware/authMiddleware');
const requireFreelancer = require('../middleware/requireFreelancer');
const { gigRules, gigIdRules } = require('../middleware/gigValidators');
const { handleValidationErrors } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.getGigs);

router.get('/mine', protect, requireFreelancer, controller.getMyGigs);

router.get(
  '/:id',
  gigIdRules,
  handleValidationErrors,
  controller.getGig
);

router.post(
  '/',
  protect,
  requireFreelancer,
  gigRules,
  handleValidationErrors,
  controller.createGig
);

router.put(
  '/:id',
  protect,
  requireFreelancer,
  gigIdRules,
  gigRules,
  handleValidationErrors,
  controller.updateGig
);

router.delete(
  '/:id',
  protect,
  requireFreelancer,
  gigIdRules,
  handleValidationErrors,
  controller.deleteGig
);

module.exports = router;
