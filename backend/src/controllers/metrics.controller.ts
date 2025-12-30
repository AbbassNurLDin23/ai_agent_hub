import type { Request, Response } from "express";
import { getMetrics } from "../services/metrics.service";

export async function getMetricsHandler(req: Request, res: Response) {
  const agentId =
    typeof req.query.agentId === "string" ? req.query.agentId : undefined;

  const result = await getMetrics(agentId);

  // If agentId provided but not found -> return 404 (cleaner than null)
  if (agentId && !result) {
    return res.status(404).json({ error: "Metrics not found for this agent" });
  }

  return res.json(result);
}
