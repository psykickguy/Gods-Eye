const { auth, db } = require('../config/firebase');
const crypto = require('crypto');
const { sendOTPEmail } = require('../services/emailService');

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login endpoint - expects ID token from frontend
const login = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user record from Firebase
    const userRecord = await auth.getUser(uid);
    
    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified
      },
      token: idToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: 'Login failed', 
      message: error.message 
    });
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (6-digit code)
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP in Firestore
    await db.collection('otps').doc(email).set({
      otp: otp,
      expiresAt: expirationTime,
      createdAt: new Date(),
      verified: false
    });
    
    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Still return success to user, but log the error
    }
    
    res.json({
      success: true,
      message: 'OTP sent to your email'
      // Remove the otp field in production - only for testing
      // otp: otp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(400).json({ 
      error: 'Failed to send OTP', 
      message: error.message 
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Get OTP from Firestore
    const otpDoc = await db.collection('otps').doc(email).get();
    
    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }
    
    const otpData = otpDoc.data();
    
    // Check if OTP is expired
    if (new Date() > otpData.expiresAt.toDate()) {
      // Delete expired OTP
      await db.collection('otps').doc(email).delete();
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    // Check if OTP matches
    if (otpData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Check if already verified
    if (otpData.verified) {
      return res.status(400).json({ error: 'OTP already used' });
    }
    
    // Mark OTP as verified
    await db.collection('otps').doc(email).update({
      verified: true,
      verifiedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({ 
      error: 'Failed to verify OTP', 
      message: error.message 
    });
  }
};

// Verify user session
const verifySession = async (req, res) => {
  try {
    const { uid, email, emailVerified } = req.user;
    
    res.json({
      success: true,
      user: {
        uid,
        email,
        emailVerified
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(401).json({ error: 'Session verification failed' });
  }
};

// Logout endpoint
const logout = async (req, res) => {
  try {
    // For Firebase, logout is handled client-side
    // This endpoint can be used for logging/cleanup
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Signup endpoint - expects ID token from frontend after user creation
const signup = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user record from Firebase
    const userRecord = await auth.getUser(uid);
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified
      },
      token: idToken
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ 
      error: 'Signup failed', 
      message: error.message 
    });
  }
};

// Create user endpoint (for registration)
const createUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create user with Firebase Admin
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });
    
    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ 
      error: 'User creation failed', 
      message: error.message 
    });
  }
};

module.exports = {
  verifyToken,
  login,
  sendOTP,
  verifyOTP,
  verifySession,
  logout,
  createUser,
  signup
};
