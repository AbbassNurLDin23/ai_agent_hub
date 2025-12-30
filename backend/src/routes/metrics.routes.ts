import { Router } from "express";
import { metricsStream } from "../sse/metrics.stream";
import { getMetricsHandler } from "../controllers/metrics.controller";

export const metricsRouter = Router();

// ✅ Analytics snapshot (ALL or per agent)
metricsRouter.get("/", getMetricsHandler);

// ✅ Live analytics stream
metricsRouter.get("/stream", metricsStream);
