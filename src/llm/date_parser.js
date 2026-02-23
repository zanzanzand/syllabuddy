require('dotenv').config()
const { GoogleGenAI } = require('@google/genai');
const API_KEY = process.env.API_KEY;
const fs = require('fs');

console.log(API_KEY);

const ai = new GoogleGenAI({apiKey: API_KEY});
const prompt = `You are a syllabus parser. Read this ENTIRE multi-page syllabus document and extract ALL information.

CRITICAL INSTRUCTIONS:
1. Scan EVERY page for dates, deadlines, exams, assignments, projects
2. Convert ALL dates to YYYY-MM-DD format (assume year 2025 if not specified)
3. Return ONLY valid JSON - no markdown, no explanations

Required JSON structure:
{
  "course_title": "full course name from syllabus",
  "course_code": "course code/number",
  "instructor": "professor name",
  "semester": "semester and year",
  "events": [
    {
      "title": "exact event name from syllabus",
      "date": "YYYY-MM-DD",
      "type": "lecture|exam|assignment|quiz|project|consultation|break|defense",
      "description": "additional details if available",
      "weight": "grade percentage if mentioned"
    }
  ]
}

IMPORTANT: 
- Include recurring lectures/classes with individual dates
- Capture submission deadlines, consultation dates, exam schedules
- If date format is unclear, use best judgment to convert to YYYY-MM-DD
- Empty fields should be empty strings "", not null`

async function main(){


    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        },
    });
    console.log(response.text);
}

main();