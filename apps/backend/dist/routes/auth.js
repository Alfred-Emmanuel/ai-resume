import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
export const router = Router();
const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
router.post("/signup", (req, res) => {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Invalid payload" });
    // TODO: Create user via Firebase Auth in real implementation
    return res.status(201).json({ ok: true });
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
router.post("/login", (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Invalid payload" });
    // TODO: Verify via Firebase, issue backend JWT
    const token = jwt.sign({ sub: parsed.data.email }, process.env.JWT_SECRET || "dev", {
        expiresIn: "1h",
    });
    return res.json({ access_token: token });
});
