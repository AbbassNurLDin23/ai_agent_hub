// backend/src/routes/providers.routes.ts
import { Router } from "express";
import { getProviders } from "../controllers/providers.controller";

export const providersRouter = Router();
providersRouter.get("/", getProviders);
