require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./app')

const PORT = process.env.PORT || 3000

// Database Connection
mongoose.connect(process.env.MONGODB_CONNECTION)
.then(()=> {
    console.log("Database connection success!")
})
.catch((error)=> {
    console.log("Database connection failed! Error: " + error)
})

// Startup
app.listen(PORT, (error) => {
    if(!error){
        console.log("Server running on port " + PORT);
    }else{
        console.error("Error occurred " + error);
        
    }
})
