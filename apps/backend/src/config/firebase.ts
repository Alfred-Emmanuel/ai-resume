import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    console.warn(
      "Firebase not initialized - FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID not provided"
    );
  }
}

export const auth = admin.apps.length > 0 ? admin.auth() : null;
export default admin;
