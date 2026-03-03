import { API_BASE_URL } from '../config';

export const generateSmartResponse = async (userPrompt: string, context: string, token: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt: userPrompt, context }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error communicating with AI backend:", error);
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
export async function getPropertyInsights(propertyId: string, token: string): Promise<AIInsights> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/insights/${propertyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

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