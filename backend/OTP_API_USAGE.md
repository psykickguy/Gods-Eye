# OTP API Usage Guide

## Overview
The authentication system uses 6-digit OTP codes instead of email links for verification.

## API Endpoints

### 1. Send OTP
**POST** `/api/auth/send-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### 3. User Registration
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

### 4. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "emailVerified": false
  },
  "token": "firebase-jwt-token"
}
```

### 5. Verify Session (Protected)
**GET** `/api/auth/verify-session`

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "emailVerified": false
  }
}
```

### 6. Logout (Protected)
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <firebase-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 7. Test Authentication
**GET** `/api/auth/test`

**Response:**
```json
{
  "message": "Auth routes working!"
}
```

## Error Responses
- `400`: Invalid OTP, OTP expired, OTP already used, or missing required fields
- `401`: Invalid token, no token provided, or login failed

## Setup Instructions

### 1. Install Dependencies
```bash
cd C:\projects\Gods-Eye\backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Gmail Setup (if using Gmail)
1. Enable 2-factor authentication on your Google account
2. Go to Google Account settings > Security > 2-Step Verification
3. Generate an "App Password" for nodemailer
4. Use the app password as `EMAIL_PASS` in your `.env` file

### 4. Alternative Email Services
The system supports multiple email providers. Edit `backend/services/emailService.js` to configure:

- **Outlook/Hotmail**: Uncomment the Outlook configuration
- **Custom SMTP**: Uncomment and configure the custom SMTP settings
- **SendGrid/Mailgun**: Modify the transporter configuration

## How It Works

1. **User Registration**: Create user account with Firebase Admin
2. **OTP Generation**: 6-digit random code generated using `Math.floor(100000 + Math.random() * 900000)`
3. **Storage**: OTPs are stored in Firestore with 10-minute expiration
4. **Email Delivery**: Professional HTML email template with the OTP code
5. **Verification**: Server validates OTP, expiration, and one-time use
6. **Authentication**: Firebase JWT tokens for session management
7. **Security**: OTPs are marked as used after verification and expired codes are deleted

## Security Features

- ✅ 10-minute OTP expiration time
- ✅ One-time use only
- ✅ Secure storage in Firestore
- ✅ Email validation
- ✅ Firebase JWT token authentication
- ✅ Automatic cleanup of expired OTPs
- ✅ Protected routes with token verification

## Testing

During development, you can temporarily uncomment the `otp` field in the response to see the generated code without setting up email:

```javascript
res.json({
  success: true,
  message: 'OTP sent to your email',
  otp: otp  // Remove this in production
});
```

## Production Considerations

1. Remove any OTP codes from API responses
2. Set up proper email service credentials
3. Configure Firebase project settings properly
4. Consider rate limiting for OTP requests
5. Add proper logging and monitoring
6. Implement email templates for different use cases (login, password reset, etc.)
7. Set up proper CORS policies
8. Use HTTPS in production

## File Structure

```
backend/
├── config/
│   ├── firebase.js          # Firebase Admin configuration
│   └── firebaseClient.js    # Firebase Client configuration
├── controllers/
│   ├── authController.js    # Authentication logic with OTP
│   └── transactionController.js
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   └── transactionRoutes.js
├── services/
│   └── emailService.js      # Email sending functionality
├── .env.example             # Environment variables template
├── app.js                   # Main application file
├── package.json             # Dependencies and scripts
└── OTP_API_USAGE.md         # This guide
```
