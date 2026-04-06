require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo').default
const GoogleStrategy = require('passport-google-oauth20').Strategy
const Syllabus = require('./models/Syllabus.js')
const User = require('./models/User.js')
const { parseSyllabus } = require('./llm/date_parser.js')
const { createEvents } = require("ics")

const app = express()


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
        let user = await User.findOne({ googleId: profile.id })
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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/png']
        if (allowed.includes(file.mimetype)){
            cb(null, true)
        } else{
            cb(new Error('Invalid file type. Only PDF and PNG allowed.'))
        }
    }
})

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).json({ error: 'Unauthorized. Please log in.' })
}

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

app.post('/syllabus/save', async (req, res) => {
    try {
        const payload = req.body

        if (!payload.events || payload.events.length === 0) {
            return res.status(400).json({ error: 'At least one event is required.' })
        }

        const syllabus = await Syllabus.findByIdAndUpdate(
            payload.SyllaID,
            {
                title: payload.title,
                code: payload.code,
                instructor: payload.instructor,
                semester: payload.semester,
                events: payload.events,
            },
            { new: true }
        )

        if (!syllabus) {
            return res.status(404).json({ error: 'Syllabus not found.' })
        }

        res.status(200).json(syllabus)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to save.' })
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

app.get('/export', async (req, res) => {
    try {

        const syllabi = await Syllabus.find()

        const events = []

        syllabi.forEach(syllabus => {
            syllabus.events.forEach(event => {

                const date = new Date(event.date)

                events.push({
                    title: event.title,
                    description: event.type + " - " + event.description,
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
            return res.send(error)
        }

        res.setHeader('Content-Type', 'text/calendar')
        res.setHeader('Content-Disposition', 'attachment; filename=calendar.ics')

        res.send(value)

    } catch (error) {
        console.log(error)
        res.send(error)
    }
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

// User info
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

// Remove profile picture
app.delete('/profile/picture', isAuthenticated, async (req, res) => {
    try {
        const googlePhoto = req.user.photos?.[0]?.value || ''
        await User.findByIdAndUpdate(req.user._id, { profilePicture: googlePhoto })
        res.json({ message: 'Profile picture removed.' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove profile picture.' })
    }
})

// Deleting account
app.delete('/delete-account', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id
        await Syllabus.deleteMany({ userId })
        await User.findByIdAndDelete(userId)
        req.logout(() => {
            res.json({ message: 'Account deleted successfully.' })
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account.' })
    }
})

module.exports = app
