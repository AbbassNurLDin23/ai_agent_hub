// backend/src/app.ts
import express from "express";
import cors from "cors";

import { agentsRouter } from "./routes/agents.routes";
import { chatRouter } from "./routes/chat.routes";
import { metricsRouter } from "./routes/metrics.routes";
import { healthRouter } from "./routes/health.routes";
import { debugRouter } from "./routes/debug.routes";
import { capabilitiesRouter } from "./routes/capabilities.routes";

import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

// ✅ Parse allowed origins from CLIENT_ORIGIN
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:8080")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

console.log("[CORS] Allowed origins:", allowedOrigins);

// ✅ CORS (simple + correct)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/curl
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(/.*/, cors());

app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Routes
app.use(healthRouter);
app.use("/api", capabilitiesRouter); // ✅ NEW
app.use("/api/agents", agentsRouter);
app.use("/api", chatRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/debug", debugRouter);

// Error handlers
app.use(notFoundMiddleware);
app.use(errorMiddleware);
