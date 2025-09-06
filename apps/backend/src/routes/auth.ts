import { Router } from "express";
import { z } from "zod";
import { createOrGetUser } from "../services/user.js";

export const router = Router();

// Firebase Auth doesn't need traditional signup/login endpoints
// Instead, we'll have endpoints to handle Firebase token verification and user creation

const VerifyTokenSchema = z.object({
  idToken: z.string(),
});

router.post("/verify", async (req, res) => {
  try {
    const parsed = VerifyTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { auth } = await import("../config/firebase.js");

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(parsed.data.idToken);

    // Create or get user in our database
    const user = await createOrGetUser(
      decodedToken.uid,
      decodedToken.email || "",
      decodedToken.email_verified || false
    );

    return res.json({
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        email_verified: user.email_verified,
      },
      message: "Token verified successfully",
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Health check endpoint for auth service
router.get("/health", (req, res) => {
  res.json({ ok: true, service: "auth" });
});
