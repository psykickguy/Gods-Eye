// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAXTwrusGICYRvljqAdCjaOsUwnrSeKJJU",
  authDomain: "gods-eye-login-6969.firebaseapp.com",
  projectId: "gods-eye-login-6969",
  storageBucket: "gods-eye-login-6969.firebasestorage.app",
  messagingSenderId: "823485073494",
  appId: "1:823485073494:web:a1f8721db598ef65ef53f7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 