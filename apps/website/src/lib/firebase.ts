import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr4LBIsv5OzUQhWVdBwDBGonYECQLApas",
  authDomain: "ai-resume-20ccb.firebaseapp.com",
  projectId: "ai-resume-20ccb",
  storageBucket: "ai-resume-20ccb.firebasestorage.app",
  messagingSenderId: "642683877756",
  appId: "1:642683877756:web:77951aa0cd2222b431ccf9",
  measurementId: "G-VFSJJ5WJDW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
