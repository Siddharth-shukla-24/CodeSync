const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Throttle credential endpoints to blunt brute-force / enumeration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;
