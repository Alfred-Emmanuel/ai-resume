// Auth controller

import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import { VerifyTokenSchema } from "../schemas/index.js";
import { createOrGetUser } from "../services/user.js";

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
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

  return sendSuccess(res, {
    user: {
      id: user.id,
      firebase_uid: user.firebase_uid,
      email: user.email,
      email_verified: user.email_verified,
    },
    message: "Token verified successfully",
  });
});

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, { ok: true, service: "auth" });
});
