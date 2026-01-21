require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testModel(modelName)g model: ${ modelName }...`);
    try {
        const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        const response = await result.response;
        console.log(`✅ Success with ${ modelName }: `, response.text());
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${ modelName }: `, error.message);
        return false;
    }
}

async function run() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing from process.env");
        return;
    }

    await testModel('gemini-3-flash-preview');
    await testModel('gemini-3.0-flash-001');
    await testModel('gemini-2.0-flash-exp');
    await testModel('gemini-1.5-flash');
}

run();
