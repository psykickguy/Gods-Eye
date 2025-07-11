// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Functions and get a reference to the service
export const functions = getFunctions(app);

export default app;
