// backend/src/routes/debug.routes.ts
import { Router } from "express";
import { envCheck } from "../controllers/debug.controller";

export const debugRouter = Router();

debugRouter.get("/env", envCheck);
