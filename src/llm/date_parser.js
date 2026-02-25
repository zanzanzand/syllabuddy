require('dotenv').config()
const { GoogleGenAI, createPartFromUri } = require('@google/genai');
const API_KEY = process.env.API_KEY;
const path = require('path');

const ai = new GoogleGenAI({apiKey: API_KEY});
// Prompt is the most CRITICAL aspect of the parser. This is the working prompt, can be improved in later iterations.
const prompt = `You are a syllabus parser. Read this ENTIRE multi-page syllabus document and extract ALL information.

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

/* 
IMPORTANT:
Gemini 2.5 Flash API has the following limits to take note of:
1. 5 Requests per Minute
2. 20 Requests per Day

EACH iteration of this main function is 2 requests, to avoid req limit when testing always give 2 minutes "break"
before running the test again.
*/
const parseSyllabus = async()=>{
    // Request 1 - File Upload
    const file = await ai.files.upload({
    file: path.join(__dirname, 'test_file.pdf'),
    config: {
        mimeType: 'application/pdf'
    }
    });

    let getFile = await ai.files.get({ name: file.name });
    while (getFile.state === 'PROCESSING') {
        getFile = await ai.files.get({ name: file.name });
        console.log(`current file status: ${getFile.state}`);
        console.log('File is still processing, retrying in 5 seconds');

        await new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });
    }
    if (getFile.state === 'FAILED') {
        throw new Error('File processing failed.');
    }
    if (!getFile.uri || !getFile.mimeType) {
        throw new Error('File upload filed or missing mimetype.')
    }
    const fileContent = createPartFromUri(getFile.uri, getFile.mimeType);
    // Request 2 - Content Generation (Hitting the "send" on the request)
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            fileContent
        ],
        config: {
            responseMimeType: "application/json",
            temperature: 0
        },
    });
    return JSON.parse(response.text)
}

module.exports = { parseSyllabus }