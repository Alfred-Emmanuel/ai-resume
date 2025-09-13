import { db } from "../config/database.js";
export const createOrGetUser = async (firebaseUid, email, emailVerified = false) => {
    try {
        // Try to get existing user
        const existingUser = await db.query("SELECT * FROM users WHERE firebase_uid = $1", [firebaseUid]);
        if (existingUser.rows.length > 0) {
            return existingUser.rows[0];
        }
        // Create new user
        const newUser = await db.query("INSERT INTO users (firebase_uid, email, email_verified) VALUES ($1, $2, $3) RETURNING *", [firebaseUid, email, emailVerified]);
        return newUser.rows[0];
    }
    catch (error) {
        console.error("Error creating/getting user:", error);
        throw error;
    }
};
export const getUserByFirebaseUid = async (firebaseUid) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE firebase_uid = $1", [firebaseUid]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    catch (error) {
        console.error("Error getting user by Firebase UID:", error);
        throw error;
    }
};
