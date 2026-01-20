require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.log("❌ NO KEY FOUND");
} else {
    console.log(`✅ KEY FOUND: ${key.substring(0, 10)}...${key.substring(key.length - 5)}`);
    console.log(`Length: ${key.length}`);
}
