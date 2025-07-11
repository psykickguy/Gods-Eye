import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

async function sendOtpToEmail(email, otp) {
  const sendOtpEmail = httpsCallable(functions, 'sendOtpEmail');
  const result = await sendOtpEmail({ email, otp });
  return result.data;
}

export default function PhoneLogin({ onSuccess }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const recaptchaRef = useRef(null);

  const sendOtp = async (e) => {
    e.preventDefault();
    // Set up reCAPTCHA
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved
      }
    }, auth);

    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
      alert('OTP sent!');
    } catch (error) {
      alert('Error sending OTP: ' + error.message);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      await confirmationResult.confirm(otp);
      alert('Phone verified!');
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Invalid OTP');
    }
  };

  return (
    <div>
      {step === 'phone' && (
        <form onSubmit={sendOtp}>
          <input
            type="tel"
            placeholder="Enter phone number (+1234567890)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <div id="recaptcha-container" ref={recaptchaRef}></div>
          <button type="submit">Send OTP</button>
        </form>
      )}
      {step === 'otp' && (
        <form onSubmit={verifyOtp}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
          />
          <button type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  );
} 