/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
      model: 'gemini-3-flash',
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

export interface AIInsights {
  title: string;
  subtitle: string;
  message: string;
  actionLabel: string;
  variant: 'success' | 'alert' | 'default';
  generatedAt: string;
  error?: boolean;
}

/**
 * Fetch AI-generated insights for a property from backend
 */
export async function getPropertyInsights(propertyId: string): Promise<AIInsights> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/insights/${propertyId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch insights: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching AI insights:', error);

    // Return fallback insights on error
    return {
      title: 'System Status Check',
      subtitle: 'OPERATIONAL OVERVIEW',
      message: 'Unable to generate AI insights at this time. All systems operational.',
      actionLabel: 'Review dashboard metrics',
      variant: 'default',
      generatedAt: new Date().toISOString(),
      error: true
    };
  }
}