import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodIssue } from "zod";

type HttpError = Error & { status?: number; code?: string };

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      details: err.issues.map((issue: ZodIssue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const e = err as HttpError;

  // Prisma common errors
  if (e?.code?.startsWith("P")) {
    return res.status(400).json({
      error: "DatabaseError",
      code: e.code,
      message: e.message,
    });
  }

  const status =
    typeof e?.status === "number" && Number.isFinite(e.status) ? e.status : 500;

  return res.status(status).json({
    error: status === 500 ? "InternalServerError" : "RequestError",
    message: e?.message ?? "Something went wrong",
  });
}
