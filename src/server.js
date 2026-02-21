const express = require('express')
const cors = require('cors')

// Temporarily allows all requests, will restrict later on for security.
app.use(cors())

const app = express()
const PORT = 3000

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