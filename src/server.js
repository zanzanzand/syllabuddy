require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const Syllabus = require('./models/Syllabus.js')

const app = express()
const PORT = process.env.PORT || 3000
const { parseSyllabus } = require('./llm/date_parser.js')
const { createEvents } = require("ics")

// Temporarily allows all requests, will restrict later on for security.
app.use(cors())

mongoose.connect(process.env.MONGODB_CONNECTION)
.then(()=> {console.log("Database connection success!");
})
.catch((error)=> {console.log("Database connection failed! Error: " + error);
})

// Function to add sample data into the database.
const start = async ()=>{
    try{
        const sample = await Syllabus.create({
            title: 'Testing!',
            code: 'CSCI 42',
            instructor: 'Bon',
            events: [{
                title: 'First Iter',
                date: new Date(),
                type: 'Exam',
                description: 'Setting up database and manually adding data to check if schema works.'
            }]
        })

        console.log(sample);
        
        // Page address to view the JSON data.
        app.get('/sample', (req, res) => {
            res.send(sample)
        })
    } catch(error){
        console.log(error);
    }
}

const scantest = async ()=>{
    try{
        const llmResponse = await parseSyllabus();

        events = llmResponse.events.map(event=>{
            let parsedDate = null
            if (event.date){
                parsedDate = new Date(event.date)
            }
            return {
                title: event.title,
                date: parsedDate,
                type: event.type,
                description: event.description
            }
        })

        const scan = await Syllabus.create({
            title: llmResponse.course_title,
            code: llmResponse.course_code,
            instructor: llmResponse.instructor,
            semester: llmResponse.semester,
            events: llmResponse.events.map(event =>({
                title: event.title,
                date: event.date,
                type: event.type,
                description: event.description
            }))
        })

        console.log(scan);

        app.get('/scan', (req, res) => {
            res.send(scan)
        })
    } catch(error){
        console.log(error);
    }
}

app.get('/export', async (req, res) => {
    try {

        const syllabi = await Syllabus.find()

        let events = []

        syllabi.forEach(syllabus => {
            syllabus.events.forEach(event => {

                const date = new Date(event.date)

                events.push({
                    title: event.title,
                    description: event.description,
                    start: [
                        date.getFullYear(),
                        date.getMonth() + 1,
                        date.getDate(),
                        date.getHours(),
                        date.getMinutes()
                    ]
                })

            })
        })

        const { error, value } = createEvents(events)

        if (error) {
            console.log(error)
            return res.status(500).send(error)
        }

        res.setHeader('Content-Type', 'text/calendar')
        res.setHeader('Content-Disposition', 'attachment; filename=calendar.ics')

        res.send(value)

    } catch (err) {
        console.log(err)
        res.status(500).send(err)
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

// "Homepage" placeholder.
app.get('/', (req, res) => {
    res.send('Welcome to Syllabuddy!')
})

start();
scantest();