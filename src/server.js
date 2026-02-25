require('dotenv').config()
const express = require('express')
const cors = require('cors')
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
        const scan = await Syllabus.create({
            title: llmResponse.course_title,
            code: llmResponse.course_code,
            instructor: llmResponse.instructor,
            semester: llmResponse.semester,
            events: llmResponse.events.map(event =>({
                title: event.title,
                date: new Date(event.date),
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