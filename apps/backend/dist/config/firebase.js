import admin from "firebase-admin";
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;
    if (!serviceAccount) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}
export const auth = admin.auth();
export default admin;
