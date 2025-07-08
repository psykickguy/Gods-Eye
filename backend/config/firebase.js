const admin = require('firebase-admin');

// Firebase Admin SDK configuration
// For development, we'll use a simplified approach
// In production, you should use a proper service account key
const serviceAccount = {
  projectId: "gods-eye-69"
};

// Initialize Firebase Admin
// For development, we'll use Application Default Credentials
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: "gods-eye-69"
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error.message);
    console.log('For full functionality, set up Firebase service account credentials');
  }
}

const auth = admin.auth();
const db = admin.firestore();

module.exports = { admin, auth, db };
