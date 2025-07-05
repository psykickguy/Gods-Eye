const express = require('express');
const router = express.Router();
const {
  verifyToken,
  login,
  sendOTP,
  verifyOTP,
  verifySession,
  logout,
  createUser
} = require('../controllers/authController');

// Public routes
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', createUser);

// Protected routes (require authentication)
router.get('/verify-session', verifyToken, verifySession);
router.post('/logout', verifyToken, logout);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;
