const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { reviewCode, explainCode } = require('../controllers/aiController');
// Stricter limit for AI routes — these hit an external paid API
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 AI calls per 5 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
});

router.post('/review', aiLimiter, reviewCode);
router.post('/explain', aiLimiter, explainCode);

module.exports = router;