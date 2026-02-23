require('dotenv').config()
const { GoogleGenAI, createPartFromUri } = require('@google/genai');
const API_KEY = process.env.API_KEY;
const path = require('path');

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
    if (file.state === 'FAILED') {
        throw new Error('File processing failed.');
    }
    if (!file.uri || !file.mimeType) {
        throw new Error('File upload filed or missing mimetype.')
    }
    const fileContent = createPartFromUri(file.uri, file.mimeType);
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
    console.log(response.text);
}

main();