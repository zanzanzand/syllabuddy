require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const Syllabus = require('./models/Syllabus.js')
const User = require('./models/User/js')

const app = express()
const PORT = process.env.PORT || 3000
const { parseSyllabus } = require('./llm/date_parser.js')

// Temporarily allows all requests, will restrict later on for security.
app.use(cors())
app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_CONNECTION
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id})
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                profilePicture: profile.photos[0].value
            })
        }
        return done(null, user)
    } catch (error) {
        return done(error, null)
    }
}
))

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch (error) {
        done(error, null)
    }
})

mongoose.connect(process.env.MONGODB_CONNECTION)
.then(()=> {console.log("Database connection success!");
})
.catch((error)=> {console.log("Database connection failed! Error: " + error);
})

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).json({ error: 'Unauthorized. Please log in.' })
}

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

// Checks for connection.
app.listen(PORT, (error) => {
    if(!error){
        console.log("Server running on port " + PORT);
    }
    else{
        console.log("Error occurred: " + error);
    }
})

// Google Login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/')
    }
)

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/')
    })
})

// "Homepage" placeholder.
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`
            <h1>Welcome to Syllabuddy!</h1>
            <p>Logged in as ${req.user.displayName}</p>
            <a href="/logout"><button>Logout</button></a>
        `)
    } else {
        res.send(`
            <h1>Welcome to Syllabuddy!</h1>
            <a href="/auth/google"><button>Login with Google</button></a>
        `)
    }
})

// Get current user info
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        res.json({
            displayName: user.displayName,
            email: user.email,
            profilePicture: user.profilePicture
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile.' })
    }
})

// Update profile picture
app.put('/profile/picture', isAuthenticated, async (req, res) => {
    try {
        const { profilePicture } = req.body
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture },
            { new: true }
        )
        res.json({ profilePicture: user.profilePicture })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile picture.' })
    }
})

// Removing profile picture
app.delete('/profile/picture', isAuthenticated, async (req, res) => {
    try {
        const googlePhoto = req.user.photos?.[0]?.value || ''
        await User.findByIdAndUpdate(req.user._id, { profilePicture: googlePhoto })
        res.json({ message: 'Profile picture removed.' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove profile picture.' })
    }
})

start();
scantest();