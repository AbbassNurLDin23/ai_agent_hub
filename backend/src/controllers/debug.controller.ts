// backend/src/controllers/debug.controller.ts
import type { Request, Response } from "express";

export function envCheck(req: Request, res: Response) {
  const groq = (process.env.GROQ_API_KEY ?? "").trim();
  const google = (process.env.GOOGLE_API_KEY ?? "").trim();
  const openai = (process.env.OPENAI_API_KEY ?? "").trim();

  res.json({
    GROQ_API_KEY: groq ? `SET (${groq.length} chars)` : "MISSING",
    GOOGLE_API_KEY: google ? `SET (${google.length} chars)` : "MISSING",
    OPENAI_API_KEY: openai ? `SET (${openai.length} chars)` : "MISSING",
    NODE_ENV: process.env.NODE_ENV ?? "",
    PORT: process.env.PORT ?? "",
  });
}
