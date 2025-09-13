import { auth } from "../config/firebase.js";
import { createOrGetUser } from "../services/user.js";
export const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split("Bearer ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        // Verify the Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        // Ensure user exists in our database
        const user = await createOrGetUser(decodedToken.uid, decodedToken.email || "", decodedToken.email_verified || false);
        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
        };
        next();
    }
    catch (error) {
        console.error("Firebase token verification failed:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
};
