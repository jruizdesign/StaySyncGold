import { API_BASE_URL } from '../config';

export interface IncidentAnalysis {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  summary: string;
  suggestedAction: string;
}

export const analyzeIncidentReport = async (description: string, token: string): Promise<IncidentAnalysis | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed with status ${response.status}`);
    }

    const data = await response.json();
    return data as IncidentAnalysis;

  } catch (error) {
    console.error("Error analyzing incident via backend:", error);
    return null;
  }
};

export const generateShiftSummary = async (_stats: any): Promise<string> => {
  // Placeholder: Shift summary logic should also be moved to backend if needed.
  // For now, we'll return a static message or implement a backend route later.
  console.warn("generateShiftSummary: Client-side storage of keys is deprecated. Please implement backend route.");
  return "Shift summary generation unavailable (Security Upgrade in progress).";
};
