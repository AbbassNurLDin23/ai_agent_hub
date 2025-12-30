import type { Request, Response } from "express";

export function notFoundMiddleware(req: Request, res: Response) {
  return res.status(404).json({
    error: "NotFound",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
