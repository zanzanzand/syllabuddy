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
const { Event } = require('./models/Event.js')
const { parseSyllabus, parseGradeWeights } = require('./llm/date_parser.js')
const { createEvents } = require("ics")
const e = require('express')


const app = express()


// Temporarily allows all requests, will restrict later on for security.
app.use(cors({
    origin: 'http://localhost:5174',
    credentials: true
}))
app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_CONNECTION
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false,
        sameSite: 'lax'
    }
}))
app.use(passport.initialize())
app.use(passport.session())

if (process.env.NODE_ENV == 'test') {
    app.use((req, res, next) => {
        req.user = global.__testUser
        req.isAuthenticated = () => !!global.__testUser
        next()
    })
}

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
        const allowed = ['application/pdf']
        if (allowed.includes(file.mimetype)){
            cb(null, true)
        } else{
            cb(new Error('Invalid file type. Only PDF allowed.'))
        }
    }
})

const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png']
        if (allowed.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Only JPG/PNG allowed'))
        }
    }
})

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).json({ error: 'Unauthorized. Please log in.' })
}

app.post('/upload', isAuthenticated, upload.single('syllabus'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." })

        const [llmResponse, gradeResponse] = await Promise.all([
            parseSyllabus(req.file.buffer, req.file.mimetype),
            parseGradeWeights(req.file.buffer, req.file.mimetype)
        ])

        const syllabus = await Syllabus.create({
            title: llmResponse.course_title,
            code: llmResponse.course_code,
            instructor: llmResponse.instructor,
            semester: llmResponse.semester,
            userId: req.user._id,
            grading: gradeResponse.grading,
            events: llmResponse.events.map(event => {
                let startDate = null
                if (event.startDate) {
                    startDate = new Date(event.startDate)
                }
                let endDate = null
                if (event.endDate) {
                    endDate = new Date(event.endDate)
                }
                return {
                    title: event.title,
                    startDate: startDate,
                    endDate: endDate,
                    type: event.type,
                    description: event.description,
                    userId: req.user._id
                }
      })
    })

    res.status(201).json(syllabus)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// Add a calendar event
app.post('/events', isAuthenticated, async (req, res) => {
    try {
        const { title, startDate, endDate, type, description } = req.body
        const event = await Event.create({ title, startDate, endDate, type, description, userId: req.user._id })
        res.status(201).json(event)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get all calendar events
app.get('/events', isAuthenticated, async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user._id })
        res.json(events)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/syllabi', isAuthenticated, async (req, res) => {
    try {
        const syllabi = await Syllabus.find({ userId: req.user._id })
        res.json(syllabi)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/syllabus/save', isAuthenticated, async (req, res) => {
    try {
        const payload = req.body

        if (!payload.events || payload.events.length === 0) {
            return res.status(400).json({ error: 'At least one event is required.' })
        }

        if (payload.events.find(e => !e.title)) {
            return res.status(400).json({ error: 'Each event must have a title.' })
        }

        if (payload.events.find(e => !e.startDate)) {
            return res.status(400).json({ error: 'Each event must have a start date.'})
        }

        const syllabus = await Syllabus.findOneAndUpdate(
            { 
                _id: payload.SyllaID,
                userId: req.user._id
            },
            {
                title: payload.title,
                code: payload.code,
                instructor: payload.instructor,
                semester: payload.semester,
                events: payload.events,
            },
            { returnDocument: 'after' }
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

app.delete('/syllabus/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const syllabus = await Syllabus.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        })
        if (!syllabus){
            return res.status(404).json({ error: 'Syllabus not found.' })
        }
        res.status(200).json({ message: 'Deleted.'})
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete.'})
    }
})

//Google Login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('http://localhost:5174')
    }
)

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://localhost:5174')
    })
})

app.get('/export', isAuthenticated, async (req, res) => {
    try {

        const syllabi = await Syllabus.find({userId: req.user._id})

        const events = []

        syllabi.forEach(syllabus => {
            syllabus.events.forEach(event => {

                const date = new Date(event.startDate)

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
app.put('/profile/picture', isAuthenticated, profileUpload.single('picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: base64 },
            { new: true }
        )

        res.json({ profilePicture: user.profilePicture })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Upload failed' })
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

// User preference
app.get('/preferences', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        res.json({
            calendarTheme: user.calendarTheme,
            calendarBackground: user.calendarBackground,
            backgroundOpacity: user.backgroundOpacity,
            categoryColors: Object.fromEntries(user.categoryColors)
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch preferences.' })
    }
})

// Update calendar theme
app.put('/preferences/theme', isAuthenticated, async (req, res) => {
    try {
        const { calendarTheme, calendarBackground, backgroundOpacity } = req.body
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { calendarTheme, calendarBackground, backgroundOpacity },
            { new: true }
        )
        res.json({
            calendarTheme: user.calendarTheme,
            calendarBackground: user.calendarBackground,
            backgroundOpacity: user.backgroundOpacity
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update theme.' })
    }
})

// Update category colors
app.put('/preferences/colors', isAuthenticated, async (req, res) => {
    try {
        const { categoryColors } = req.body
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { categoryColors },
            { new: true }
        )
        res.json({
            categoryColors: Object.fromEntries(user.categoryColors)
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category colors.' })
    }
})

// Reset category colors to default
app.put('/preferences/colors/reset', isAuthenticated, async (req, res) => {
    try {
        const defaultColors = {
            'exam': '#FF6B6B',
            'assignment': '#4ECDC4',
            'project': '#45B7D1',
            'quiz': '#96CEB4',
            'other': '#DDA0DD'
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { categoryColors: defaultColors },
            { new: true }
        )
        res.json({
            categoryColors: Object.fromEntries(user.categoryColors)
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset category colors.' })
    }
})

app.put('/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
        if (!event) return res.status(404).json({ error: 'Event not found.' })
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to edit event.' });
    }
})

app.delete('/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!event) return res.status(404).json({ error: 'Event not found.' })
        res.json({ message: 'Event deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete event.'});
    }
})

// To get the correct error codes since multer errors always return 500.
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max 10MB.' })
    }
    if (err.message === 'Invalid file type. Only PDF allowed.') {
        return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
})

// auto-input parsed grade weights into the calculator
app.post('/parse-grades', async (req, res) => {
  try {
    const { fileBuffer, mimeType } = req.body;

    const result = await parseGradeWeights(
      Buffer.from(fileBuffer, 'base64'),
      mimeType
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Parsing failed' });
  }
});

module.exports = app