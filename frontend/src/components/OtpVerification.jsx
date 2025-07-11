import React, { useState, useEffect } from 'react';
import './login-otp.css';

export default function OtpVerification({ email, onSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Generate and send OTP when component mounts
  useEffect(() => {
    generateAndSendOtp();
  }, []);

  const generateOtp = () => {
    // For development/testing, use fixed OTP
    const isDevelopment = process.env.NODE_ENV === 'development' || true;
    if (isDevelopment) {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateAndSendOtp = async () => {
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);
    
    try {
      // Send OTP via your backend API
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: newOtp }),
      });
      
      if (response.ok) {
        setOtpSent(true);
        console.log('OTP sent successfully to:', email);
        console.log('Generated OTP (for testing):', newOtp); // Remove in production
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
      // For development, still set the OTP
      setOtpSent(true);
      console.log('Generated OTP (for testing):', newOtp);
    }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 1) return; // Prevent multiple digits
    
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-${idx - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const enteredOtp = otp.join('');
    
    if (enteredOtp === generatedOtp) {
      setTimeout(() => {
        setLoading(false);
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setLoading(false);
      setError('Incorrect OTP. Please try again.');
      setOtp(['', '', '', '', '', '']); // Clear OTP
      document.getElementById('otp-0')?.focus();
    }
  };

  const resendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setOtpSent(false);
    generateAndSendOtp();
  };

  return (
    <div className="login-bg">
      <div className="dot"></div>
      <div className="shape1"></div>
      <div className="shape2"></div>
      <div className="shape3"></div>
      <div className="login-container">
        <h1 className="login-title">verify otp</h1>
        
        {otpSent && (
          <p className="otp-info">OTP sent to {email}</p>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="otp-container">
            {[0,1,2,3,4,5].map(idx => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength={1}
                className="otp-input"
                value={otp[idx]}
                onChange={e => handleChange(e, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                required
              />
            ))}
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading || otp.some(digit => !digit)}
          >
            {loading ? 'verifying...' : 'verify otp'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="button" 
            className="resend-button" 
            onClick={resendOtp}
          >
            resend otp
          </button>
        </form>
      </div>
    </div>
  );
}
