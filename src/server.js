const express = require('express')
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