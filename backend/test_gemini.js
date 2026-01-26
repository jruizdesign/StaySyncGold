const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in environment variables.");
    process.exit(1);
}

console.log("Initializing Gemini Client...");
const genAI = new GoogleGenAI({ apiKey: apiKey });

async function testGemini() {
    try {
        console.log("Testing model: gemini-3-flash-preview...");
        const model = 'gemini-3-flash-preview';

        const result = await genAI.models.generateContent({
            model: model,
            contents: "Hello, can you confirm you are working? Reply with 'Gemini Service Operational'.",
        });

        console.log("\n--- API Response ---");
        console.log(result.text);
        console.log("--------------------\n");
        console.log("Test Passed: Gemini API is accessible.");

    } catch (error) {
        console.error("\nTest Failed:", error.message);
        if (error.response) {
            console.error("Response:", error.response);
        }
    }
}

testGemini();
