// backend/src/controllers/providers.controller.ts
import type { Request, Response } from "express";
import { getEnabledProviders } from "../config/providers";

export function getProviders(req: Request, res: Response) {
  const providers = getEnabledProviders();
  res.json({ providers });
}
