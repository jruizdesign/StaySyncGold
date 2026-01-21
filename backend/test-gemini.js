require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const result = await genAI.models.generateContent({
            model: modelName,
            contents: "Hello, are you there?"
        });
        const responseText = result.text;
        console.log(`✅ Success with ${modelName}: `, responseText);
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${modelName}: `, error.message, error);
        return false;
    }
}

async function run() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing from process.env");
        return;
    }

    await testModel('gemini-3-flash-preview');
    // Keeping older models just in case for testing, but 3 is priority
    // await testModel('gemini-2.0-flash-exp');
    // await testModel('gemini-3-flash-preview');
}

run();
