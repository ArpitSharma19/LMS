let groqInstance = null;

const getGroq = async () => {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is missing in .env");
      return null;
    }
    const Groq = (await import("groq-sdk")).default;
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY.trim(),
    });
  }
  return groqInstance;
};

const SYSTEM_PROMPT = `You are an intelligent AI assistant for an online Learning Management System (LMS). Your role is to help students and educators with:

- Course content questions and concept explanations
- Assignment guidance and problem-solving approaches
- LMS navigation and platform features
- Study tips and learning strategies
- Course recommendations based on interests
- Technical programming help (React, JavaScript, Node.js, etc.)

Be concise, friendly, and educational. Format code examples with proper markdown code blocks.
If you don't know something specific about this platform's courses, offer general guidance.`;

export const getChatCompletion = async (messages) => {
  try {
    const groq = await getGroq();
    if (!groq) {
      return "I'm sorry, my AI brain is currently offline (API key missing). Please try again later.";
    }

    // Sanitize messages: remove extra system messages and ensure roles are valid
    const sanitizedMessages = messages
      .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content)
      .map(msg => ({
        role: msg.role,
        content: String(msg.content).trim()
      }))
      .filter(msg => msg.content.length > 0);

    if (sanitizedMessages.length === 0) {
        return "I'm here to help! What's on your mind?";
    }

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...sanitizedMessages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    console.log("Groq AI RESPONSE Choice:", completion.choices[0]?.message?.content);

    return (
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't think of a response right now. How else can I help you?"
    );
  } catch (error) {
    console.error("Groq Error:", error.message);
    return "I'm experiencing some technical difficulties with my AI service. Please ask me something else or try again in a moment.";
  }
};
