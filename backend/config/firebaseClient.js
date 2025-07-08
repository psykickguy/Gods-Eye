const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

// Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZXR4ZdWN1OYDkTml2Sutna_JKSq8jKAU",
  authDomain: "gods-eye-69.firebaseapp.com",
  projectId: "gods-eye-69",
  storageBucket: "gods-eye-69.firebasestorage.app",
  messagingSenderId: "879583315436",
  appId: "1:879583315436:web:c46990ef2d48e5e8d7acc9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

module.exports = { app, auth, firebaseConfig };
