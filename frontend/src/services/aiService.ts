import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY not set for Gemini");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSmartResponse = async (userPrompt: string, context: string): Promise<string> => {
  const client = getAIClient();
  if (!client) return "AI Service Unavailable: Missing API Key.";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `System: You are an AI assistant for a hotel PMS called StaySyncGold. 
      Use the following context to answer the user's question concisely.
      
      Context: ${context}
      
      User: ${userPrompt}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Fast response preferred for UI
      }
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error communicating with the AI service.";
  }
};