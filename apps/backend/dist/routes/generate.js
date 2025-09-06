import { Router } from "express";
import { z } from "zod";
export const router = Router();
const GenerateSchema = z.object({
    user_id: z.string(),
    resume_id: z.string(),
    job_id: z.string(),
    options: z.object({
        format: z.enum(["pdf", "docx"]),
        includeCoverLetter: z.boolean().optional(),
    }),
});
router.post("/resume", (req, res) => {
    const parsed = GenerateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Invalid payload" });
    const generation_id = cryptoRandom();
    return res
        .status(202)
        .json({ generation_id, status: "queued", estimated_size_kb: 40 });
});
router.get("/:id/status", (req, res) => {
    const { id } = req.params;
    return res.json({ generation_id: id, status: "processing" });
});
router.get("/:id/download", (req, res) => {
    const { id } = req.params;
    // Placeholder presigned URL
    return res.json({
        generation_id: id,
        downloadUrl: `https://example.com/download/${id}`,
    });
});
router.post("/coverletter", (_req, res) => {
    return res.status(200).json({ text: "Cover letter content will be here." });
});
function cryptoRandom() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
