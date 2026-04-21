require('dotenv').config()
const { GoogleGenAI } = require('@google/genai');
const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({apiKey: API_KEY});
// Prompt is the most CRITICAL aspect of the parser. This is the working prompt, can be improved in later iterations.
const CATEGORY_DEFINITIONS = `
CATEGORY DEFINITIONS (use consistently across all fields):
- exam: Midterm, final, or any scheduled written examination
- assignment: Individual or group written submissions with a deadline (essays, problem sets, reports, reflection papers)
- project: Multi-phase group deliverables that include a final output AND a defense, presentation, or oral examination. Defense sessions are part of this category.
- quiz: Short quizzes during class
- recitation: Oral recitation or class participation
- lecture: Regular class sessions and discussions
- consultation: Scheduled feedback or outline review sessions
- break: Holidays or no-class periods`

const syllabusPrompt = `You are a syllabus parser. Read this ENTIRE multi-page syllabus document and extract ALL information.

CRITICAL INSTRUCTIONS:
1. Scan EVERY page for dates, deadlines, exams, assignments, projects
2. Convert ALL dates to YYYY-MM-DD format (assume year 2026 if not specified)
3. Return ONLY valid JSON - no markdown, no explanations

${CATEGORY_DEFINITIONS}

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
      "type": "lecture|exam|assignment|quiz|project|consultation|break",
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

${CATEGORY_DEFINITIONS}

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
- If percentages are given per individual item, sum them into their category total (e.g. First Essay 15% + Second Essay 15% + Reflection Paper 30% = assignment 60%)
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
        model: 'gemini-3.1-flash-lite-preview',
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
        model: 'gemini-3.1-flash-lite-preview',
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