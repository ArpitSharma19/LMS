import { getChatCompletion } from "../services/groq.service.js";
import { ChatHistory } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const chat = catchAsync(async (req, res) => {
  const { message, history } = req.body;
  
  if (!message?.trim()) throw new ApiError(400, "A message is required");
  if (message.trim().length > 2000) throw new ApiError(400, "Message too long");

  const sanitizedHistory = Array.isArray(history) 
    ? history.filter(h => h.role && h.content).slice(-10)
    : [];

  try {
    const reply = await getChatCompletion([...sanitizedHistory, { role: "user", content: message.trim() }]);
    if (!reply) throw new ApiError(502, "AI service returned an empty response");

    const userId = req.auth?.userId;
    if (userId) {
      await ChatHistory.create({ userId, role: "user", content: message.trim() });
      await ChatHistory.create({ userId, role: "assistant", content: reply });
    }

    res.json({ success: true, data: { reply } });
  } catch (error) {
    res.json({ success: true, data: { reply: "AI services are currently busy. Please try again later." } });
  }
});