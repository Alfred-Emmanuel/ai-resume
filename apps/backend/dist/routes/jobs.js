import { Router } from "express";
import { z } from "zod";
export const router = Router();
const CaptureSchema = z.object({
    title: z.string().min(1),
    company: z.string().optional(),
    location: z.string().optional(),
    source: z.enum(["linkedin", "indeed", "other"]).optional(),
    rawText: z.string().min(1),
});
router.post("/capture", (req, res) => {
    const parsed = CaptureSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Invalid payload" });
    const id = cryptoRandom();
    return res.status(201).json({ job_id: id });
});
function cryptoRandom() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
