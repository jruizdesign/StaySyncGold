// backend/src/services/__tests__/aiService.test.js

// Define mocks *before* they are used in the mock factory
const mockGenerateContent = jest.fn();

// Mock the '@google/genai' library. This is hoisted.
jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn(() => ({
        models: {
            generateContent: mockGenerateContent
        }
    })),
}));

// Require the service *after* setting up the mocks
const {
    generatePropertyInsights,
    generateFinancialBriefing,
    analyzeMaintenanceRequest,
    generateChatResponse
} = require('../aiService');

describe('AI Service', () => {
    beforeEach(() => {
        // Clear mock history before each test
        mockGenerateContent.mockClear();
    });

    describe('generatePropertyInsights', () => {
        it('should return AI-generated insights on success', async () => {
            const mockApiResponse = {
                text: JSON.stringify({
                    title: 'High Priority Maintenance',
                    subtitle: 'MAINTENANCE',
                    message: 'Urgent action required for 2 high priority tickets.',
                    actionLabel: 'Dispatch team now',
                    variant: 'alert'
                }),
            };
            mockGenerateContent.mockResolvedValue(mockApiResponse);

            const propertyData = {
                maintenanceTickets: [{ priority: 'High' }, { priority: 'Critical' }],
                reservations: [],
                occupancy: { occupied: 10, total: 20, percentage: 50 },
                staffShifts: []
            };

            const insights = await generatePropertyInsights(propertyData);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3-flash-preview' }));
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
            expect(insights).toHaveProperty('title', 'High Priority Maintenance');
            expect(insights).toHaveProperty('subtitle', 'MAINTENANCE');
            expect(insights).toHaveProperty('variant', 'alert');
            expect(insights).toHaveProperty('generatedAt');
        });

        it('should return fallback insights on failure', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            const insights = await generatePropertyInsights({});

            expect(insights).toHaveProperty('title', 'System Status Check');
            expect(insights).toHaveProperty('subtitle', 'OPERATIONAL OVERVIEW');
            expect(insights).toHaveProperty('variant', 'default');
            expect(insights).toHaveProperty('error', true);
            consoleErrorSpy.mockRestore();
        });
    });

    describe('generateFinancialBriefing', () => {
        it('should return a financial briefing string on success', async () => {
            const briefingText = '- **Financial Health**: Strong revenue projected.';
            const mockApiResponse = {
                text: briefingText,
            };
            mockGenerateContent.mockResolvedValue(mockApiResponse);

            const dailyData = { revenue: 5000, debt: 100 };
            const briefing = await generateFinancialBriefing(dailyData);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3-flash-preview' }));
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
            expect(briefing).toBe(briefingText);
        });

        it('should return a fallback message on failure', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            mockGenerateContent.mockRejectedValue(new Error('API Error'));
            const briefing = await generateFinancialBriefing({});
            expect(briefing).toBe('Unable to generate financial briefing. AI Service Unavailable.');
            consoleErrorSpy.mockRestore();
        });
    });

    describe('analyzeMaintenanceRequest', () => {
        it('should return a structured analysis on success', async () => {
            const analysis = {
                severity: 'HIGH',
                category: 'Plumbing',
                summary: 'The main water pipe is leaking in the basement.',
                suggestedAction: 'Shut off main water valve and call emergency plumber.',
            };
            const mockApiResponse = {
                text: JSON.stringify(analysis),
            };
            mockGenerateContent.mockResolvedValue(mockApiResponse);

            const description = 'The main water pipe is leaking in the basement.';
            const result = await analyzeMaintenanceRequest(description);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3-flash-preview' }));
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
            expect(result).toEqual(analysis);
        });

        it('should return a fallback analysis on failure', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            mockGenerateContent.mockRejectedValue(new Error('API Error'));
            const description = 'The TV remote is missing.';
            const result = await analyzeMaintenanceRequest(description);

            expect(result).toEqual({
                severity: "MEDIUM",
                category: "Other",
                summary: "The TV remote is missing....",
                suggestedAction: "Investigate reported issue."
            });
            consoleErrorSpy.mockRestore();
        });
    });

    describe('generateChatResponse', () => {
        it('should return a chat response string on success', async () => {
            const responseText = 'The current occupancy is 75%.';
            const mockApiResponse = {
                text: responseText,
            };
            mockGenerateContent.mockResolvedValue(mockApiResponse);

            const userPrompt = 'What is the occupancy?';
            const context = 'Occupancy: 15/20 rooms (75%)';
            const response = await generateChatResponse(userPrompt, context);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-3-flash-preview' }));
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
            expect(response).toBe(responseText);
        });

        it('should return a fallback message on failure', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            mockGenerateContent.mockRejectedValue(new Error('API Error'));
            const response = await generateChatResponse('Hi', '');
            expect(response).toBe('Sorry, I encountered an error communicating with the AI service.');
            consoleErrorSpy.mockRestore();
        });
    });
});
