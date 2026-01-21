import { GoogleGenAI } from '@google/genai';
// ... (existing code)

// Initialize Gemini GoogleGenAI
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

/**
 * Generate AI insights for a property based on operational data
 * @param {Object} propertyData - Aggregated property data
 * @param {Array} propertyData.maintenanceTickets - Open maintenance tickets
 * @param {Array} propertyData.reservations - Today's reservations
 * @param {Object} propertyData.occupancy - Current occupancy stats
 * @param {Array} propertyData.staffShifts - Active staff shifts
 * @returns {Promise<Object>} AI-generated insights
 */
async function generatePropertyInsights(propertyData) {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            systemInstruction: 'You are an AI assistant for a hotel property management system called StaySync. Analyze the following operational data and provide a brief, actionable insight for the property manager.'
        });

        // Initial content to prime the model (optional, but good for setting tone)
        // const initialResponse = await model.generateContent('Hello, ready for daily insights?');
        // console.log('Initial AI response:', initialResponse.response.text());

        // Build context from property data for the main prompt
        const context = buildPropertyContext(propertyData);

        const prompt = `You are an AI assistant for a hotel property management system called StaySync. 
Analyze the following operational data and provide a brief, actionable insight for the property manager.

${context}

Provide your response in the following JSON format:
{
  "title": "Brief title (max 6 words)",
  "subtitle": "Category in UPPERCASE (e.g., OPERATIONS, MAINTENANCE, REVENUE)",
  "message": "One concise sentence with the key insight (max 25 words)",
  "actionLabel": "Specific action recommendation (max 10 words)",
  "variant": "success, alert, or default"
}

Keep it professional, concise, and actionable. Focus on the most important operational priority.`;

        const result = await model.generateContent(prompt);
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const insights = JSON.parse(jsonMatch[0]);

        return {
            ...insights,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating AI insights:', error);

        // Return fallback insights
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

/**
 * Build context string from property data
 */
function buildPropertyContext(data) {
    const parts = [];

    // Maintenance tickets
    if (data.maintenanceTickets && data.maintenanceTickets.length > 0) {
        const openCount = data.maintenanceTickets.length;
        const highPriority = data.maintenanceTickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;
        parts.push(`Maintenance: ${openCount} open tickets${highPriority > 0 ? `, ${highPriority} high priority` : ''}`);
    } else {
        parts.push('Maintenance: No open tickets');
    }

    // Reservations
    if (data.reservations) {
        const checkIns = data.reservations.filter(r => r.type === 'check_in').length;
        const checkOuts = data.reservations.filter(r => r.type === 'check_out').length;
        parts.push(`Today: ${checkIns} check-ins, ${checkOuts} check-outs`);
    }

    // Occupancy
    if (data.occupancy) {
        parts.push(`Occupancy: ${data.occupancy.occupied}/${data.occupancy.total} rooms (${data.occupancy.percentage}%)`);
    }

    // Staff
    if (data.staffShifts) {
        const activeStaff = data.staffShifts.filter(s => s.status === 'active').length;
        const onBreak = data.staffShifts.filter(s => s.status === 'on_break').length;
        parts.push(`Staff: ${activeStaff} active${onBreak > 0 ? `, ${onBreak} on break` : ''}`);
    }

    return parts.join('\n');
}

/**
 * Generate Financial Briefing using Gemini 3 Flash
 * @param {Object} dailyData - Daily financial data
 * @returns {Promise<string>} - The briefing text
 */
async function generateFinancialBriefing(dailyData) {
    try {
        // User requested 'gemini-3.0-flash-001' specifically for this feature
        // Note: If 3.0 is not valid, this will fail. Fallback handling recommended but complying with request.
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `
            You are a specialized Financial Analyst for a Hotel Manager.
            Analyze the following daily financial data and provide a strictly formatted EXECUTIVE BRIEFING.
            
            DATA:
            ${JSON.stringify(dailyData, null, 2)}
            
            OUTPUT FORMAT:
            - **Financial Health**: [1 sentence summary]
            - **Critical Action**: [The single most important debt to collect today]
            - **Risk Alert**: [Any red flags, e.g. high balance in-house or low projected revenue]
            
            Keep it concise, professional, and actionable. Do not use markdown headers other than bold keys.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Financial Briefing Error:", error);
        return "Unable to generate financial briefing. AI Service Unavailable.";
    }
}


/**
 * Analyze maintenance request for severity and categorization
 * @param {string} description - User reported issue description
 * @returns {Promise<Object>} - Analysis result
 */
async function analyzeMaintenanceRequest(description) {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            generationConfig: {
                responseMimeType: "application/json", // Use responseMimeType for JSON output
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        severity: {
                            type: SchemaType.STRING,
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                            description: 'The urgency of the issue.'
                        },
                        category: {
                            type: SchemaType.STRING,
                            description: 'The domain of the issue (e.g., Plumbing, Electrical, Housekeeping, IT).'
                        },
                        summary: {
                            type: SchemaType.STRING,
                            description: 'A concise 1-sentence summary of the issue.'
                        },
                        suggestedAction: {
                            type: SchemaType.STRING,
                            description: 'A recommended action for the staff member.'
                        }
                    },
                    required: ['severity', 'category', 'summary', 'suggestedAction']
                }
            }
        });

        const prompt = `Analyze the following hotel room issue report: "${description}". Categorize it, determine severity, summarize, and suggest immediate action for the staff.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return JSON.parse(text);
    } catch (error) {
        console.error("AI Maintenance Analysis Error:", error);
        // Fallback
        return {
            severity: "MEDIUM",
            category: "Other",
            summary: description.substring(0, 50) + "...",
            suggestedAction: "Investigate reported issue."
        };
    }
}

async function generateChatResponse(userPrompt, context) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const systemPrompt = `System: You are an AI assistant for a hotel PMS called StaySyncGold. 
      Use the following context to answer the user's question concisely.
      
      Context: ${context}
      
      User: ${userPrompt}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "Sorry, I encountered an error communicating with the AI service.";
    }
}

module.exports = {
    generatePropertyInsights,
    generateFinancialBriefing,
    analyzeMaintenanceRequest,
    generateChatResponse
};
