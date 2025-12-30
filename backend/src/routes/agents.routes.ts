import { Router } from "express";
import {
  createAgent,
  deleteAgent,
  getAgentById,
  listAgents,
  updateAgent,
} from "../controllers/agents.controller";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.get("/:id", getAgentById);
agentsRouter.post("/", createAgent);

// ✅ Support BOTH PUT and PATCH
agentsRouter.put("/:id", updateAgent);
agentsRouter.patch("/:id", updateAgent);

agentsRouter.delete("/:id", deleteAgent);
