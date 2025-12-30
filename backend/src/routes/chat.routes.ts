import { Router } from "express";
import {
  listAgentConversations,
  startConversation,
  listMessages,
  sendMessage,
  sendMessageDirect,
} from "../controllers/chat.controller";

export const chatRouter = Router();

// ✅ NEW: direct chat endpoint
chatRouter.post("/chat", sendMessageDirect);

// Existing endpoints
chatRouter.get("/agents/:agentId/conversations", listAgentConversations);
chatRouter.post("/agents/:agentId/conversations", startConversation);

chatRouter.get("/conversations/:conversationId/messages", listMessages);
chatRouter.post("/conversations/:conversationId/messages", sendMessage);
