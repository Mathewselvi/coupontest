const express = require('express');
const router = express.Router();
const { submitLead, getLeads, getLeadById, deleteLead } = require('../controllers/leadController');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/auth');

router.post('/submit', apiLimiter, submitLead);
router.get('/', protect, getLeads);
router.get('/:id', protect, getLeadById);
router.delete('/:id', protect, deleteLead);

module.exports = router;
