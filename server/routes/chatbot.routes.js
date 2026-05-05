import express from "express";
import { chat } from "../controllers/chatbot.controller.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

// Authentication is optional for chatbot to support landing page guests
const chatbotRouter = express.Router();

chatbotRouter.post("/chat", optionalProtect, chat);

export default chatbotRouter;
