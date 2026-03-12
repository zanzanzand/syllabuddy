require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const mongoose = require('mongoose')
const Syllabus = require('./models/Syllabus.js')

const app = express()
const PORT = process.env.PORT || 3000
const { parseSyllabus } = require('./llm/date_parser.js')

// Temporarily allows all requests, will restrict later on for security.
app.use(cors())

mongoose.connect(process.env.MONGODB_CONNECTION)
.then(()=> {console.log("Database connection success!");
})
.catch((error)=> {console.log("Database connection failed! Error: " + error);
})

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, res, cb) => {
        const allowed = ['application/pdf', 'image/png']
        if (allowed.includes.file.mimetype){
            cb(null, True)
        } else{
            cb(new Error('Invalid file type. Only PDF and PNG allowed.'))
        }
    }
})

// "Homepage" placeholder.
app.get('/', (req, res) => {
    res.send('Welcome to Syllabuddy!')
})

app.post('/upload', upload.single('syllabus'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." })

        const llmResponse = await parseSyllabus(req.file.buffer, req.file.mimetype)

        const syllabus = await Syllabus.create({
            title: llmResponse.course_title,
            code: llmResponse.course_code,
            instructor: llmResponse.instructor,
            semester: llmResponse.semester,
            events: llmResponse.events.map(event => {
                let date = null
                if (event.date) {
                    date = new Date(event.date)
                }
                return {
                    title: event.title,
                    date: date,
                    type: event.type,
                    description: event.description
                }
      })
    })

    res.status(201).json(syllabus)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Checks for connection.
app.listen(PORT, (error) => {
    if(!error){
        console.log("Server running on port " + PORT);
    }
    else{
        console.log("Error occurred: " + error);
    }
})