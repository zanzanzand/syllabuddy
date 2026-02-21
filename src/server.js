require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
const PORT = process.env.PORT || 3000

// Temporarily allows all requests, will restrict later on for security.
app.use(cors())

mongoose.connect(process.env.MONGODB_CONNECTION)
.then(()=> {console.log("Database connection success!");
})
.catch((error)=> {console.log("Database connection failed! Error: " + error);
})

app.listen(PORT, (error) => {
    if(!error){
        console.log("Server running on port " + PORT);
    }
    else{
        console.log("Error occurred: " + error);
    }
})

app.get('/', (req, res) => {
    res.send("Hello World")
})