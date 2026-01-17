const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        // Build context from property data
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
        const response = await result.response;
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

module.exports = {
    generatePropertyInsights
};
