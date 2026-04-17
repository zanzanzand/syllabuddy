require('dotenv').config()
const { GoogleGenAI, createPartFromUri } = require('@google/genai');
const API_KEY = process.env.API_KEY;
const path = require('path');

const ai = new GoogleGenAI({apiKey: API_KEY});
// Prompt is the most CRITICAL aspect of the parser. This is the working prompt, can be improved in later iterations.
const syllabusPrompt = `You are a syllabus parser. Read this ENTIRE multi-page syllabus document and extract ALL information.

CRITICAL INSTRUCTIONS:
1. Scan EVERY page for dates, deadlines, exams, assignments, projects
2. Convert ALL dates to YYYY-MM-DD format (assume year 2026 if not specified)
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
      "startDate": "YYYY-MM-DD",
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
- If date cannot be converted to YYYY-MM-DD, set startDate to null
- startDate must always be either a valid YYYY-MM-DD string or null, never an empty string
- All other empty fields should be empty strings "", not null`

const gradePrompt = `You are a grading policy extractor. Read this syllabus and extract the grading breakdown.

Return ONLY valid JSON - no markdown, no explanations:
{
  "grading": {
    "exam": <number or null>,
    "assignment": <number or null>,
    "project": <number or null>,
    "quiz": <number or null>,
    "recitation": <number or null>,
    "other": <number or null>
  }
}

IMPORTANT:
- Values are percentages (0-100)
- If a category is not mentioned, set it to null
- If percentages are given per individual item, sum them into their category total
- Only return the JSON object, nothing else`

/* 
IMPORTANT:
Gemini 2.5 Flash API has the following limits to take note of:
1. 5 Requests per Minute
2. 20 Requests per Day

EACH iteration of this main function is 1 request, to avoid req limit when testing always give 2 minutes "break"
before running the test again.
*/
const parseSyllabus = async(fileBuffer, mimeType)=>{
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            syllabusPrompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: fileBuffer.toString("base64")
                }
            }
        ],
        config: {
            responseMimeType: "application/json",
            temperature: 0
        },
    });
    return JSON.parse(response.text)
}

const parseGradeWeights = async(fileBuffer, mimeType)=>{
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            gradePrompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: fileBuffer.toString("base64")
                }
            }
        ],
        config: {
            responseMimeType: "application/json",
            temperature: 0
        }
    });
    return JSON.parse(response.text)
}

module.exports = { parseSyllabus, parseGradeWeights }