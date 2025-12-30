// backend/src/routes/capabilities.routes.ts
import { Router } from "express";
import { getCapabilities } from "../controllers/capabilities.controller";

export const capabilitiesRouter = Router();

capabilitiesRouter.get("/capabilities", getCapabilities);
