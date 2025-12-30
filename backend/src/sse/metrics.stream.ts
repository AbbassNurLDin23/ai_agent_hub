import { Request, Response } from "express";
import { getMetrics } from "../services/metrics.service";

export async function metricsStream(req: Request, res: Response) {
  const agentId = (req.query.agentId as string | undefined) || undefined;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = async () => {
    const metrics = await getMetrics(agentId);
    res.write(`event: metrics\n`);
    res.write(
      `data: ${JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
  };

  // send immediately, then every 3s
  await send();
  const timer = setInterval(send, 3000);

  req.on("close", () => {
    clearInterval(timer);
    res.end();
  });
}
