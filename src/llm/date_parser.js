require('dotenv').config()
const { GoogleGenAI } = require('@google/genai');
const API_KEY = process.env.API_KEY;


console.log(API_KEY);

const ai = new GoogleGenAI({apiKey: API_KEY});

async function main(){
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'List the alphabet and tell me a random fun fact about ai.',
    });
    console.log(response.text);
}

main();