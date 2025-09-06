import { db } from "../config/database.js";

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export const createOrGetUser = async (
  firebaseUid: string,
  email: string,
  emailVerified: boolean = false
): Promise<User> => {
  try {
    // Try to get existing user
    const existingUser = await db.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebaseUid]
    );

    if (existingUser.rows.length > 0) {
      return existingUser.rows[0];
    }

    // Create new user
    const newUser = await db.query(
      "INSERT INTO users (firebase_uid, email, email_verified) VALUES ($1, $2, $3) RETURNING *",
      [firebaseUid, email, emailVerified]
    );

    return newUser.rows[0];
  } catch (error) {
    console.error("Error creating/getting user:", error);
    throw error;
  }
};

export const getUserByFirebaseUid = async (
  firebaseUid: string
): Promise<User | null> => {
  try {
    const result = await db.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebaseUid]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error getting user by Firebase UID:", error);
    throw error;
  }
};
