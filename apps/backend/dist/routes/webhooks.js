import { Router } from "express";
export const router = Router();
router.post("/stripe", (req, res) => {
    // TODO: verify Stripe signature
    res.json({ received: true });
});
