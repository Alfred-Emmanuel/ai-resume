import { Router } from "express";
import { z } from "zod";
import type { UUID } from "@ai-resume/types";

export const router = Router();

const UploadResponse = z.object({ resume_id: z.string() });

router.post("/upload", (_req, res) => {
  const id: UUID = cryptoRandom();
  const payload = { resume_id: id };
  return res.status(201).json(UploadResponse.parse(payload));
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  return res.json({
    id,
    filename: "resume.docx",
    uploadedAt: new Date().toISOString(),
  });
});

function cryptoRandom(): UUID {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
