require('dotenv').config()
const request = require('supertest')
const app = require('../src/app')
const path = require('path')
const mongoose = require('mongoose')
const User = require('../src/models/User')
const Syllabus = require('../src/models/Syllabus')
const { Event } = require('../src/models/Event')

jest.mock('../src/llm/date_parser', () => ({
    parseSyllabus: jest.fn(),
    parseGradeWeights: jest.fn().mockResolvedValue({
        grading: { exam: 100, assignment: null, project: null, quiz: null, recitation: null, other: null }
    })
}))

jest.setTimeout(30000)
let testSyllabusId
let testEventId

describe("Syllabuddy Endpoint Tests", () => {
    beforeAll(async() => {
        await mongoose.connect(process.env.MONGODB_CONNECTION)

        const userId = new mongoose.Types.ObjectId()

        await User.create({
            _id: userId,
            googleId: 'test-google-id',
            displayName: 'Test User',
            email: 'test@test.com',
            profilePicture: ''
        })

        global.__testUser = {
            _id: userId,
            displayName: 'Test User',
            email: 'test@test.com'
        }

        const syllabus = await Syllabus.create({
            title: 'Test Course',
            code: 'TEST 101',
            instructor: 'Doctor Test',
            semester: '1st Sem 2026',
            userId,
            events: [
                { title: 'Test Exam', startDate: new Date('2026-04-23'), type: 'exam', description: '', userId }
            ]
        })

        testSyllabusId = syllabus._id.toString()

        const event = await Event.create({
            title: 'Test Event',
            startDate: new Date('2026-04-24'),
            type: 'quiz',
            description: 'testest',
            userId
        })
        testEventId = event._id.toString()
    })

    afterAll(async() => {
        await Syllabus.deleteMany({ code:'TEST 101' })
        await Event.deleteMany({ title: 'Test Event' })
        await User.deleteOne({ googleId: 'test-google-id' })
        await mongoose.connection.close()
        global.__testUser = null
    })

    // Login 
    test("GET / returns 200", async() => {
        const res = await request(app).get("/")
        expect(res.statusCode).toBe(200);
    })

    test("GET /auth/google redirects", async() => {
        const res = await request(app).get("/auth/google")
        expect(res.statusCode).toBe(302);
    })
    
    test("GET /auth/google/callback redirects", async() => {
        const res = await request(app).get("/auth/google/callback")
        expect(res.statusCode).toBe(302);
    })

    test("GET /logout redirects", async() => {
        const res = await request(app).get("/logout")
        expect(res.statusCode).toBe(302);
    })
    
    // Profile
    test("GET /profile returns user info", async () => {
        const res = await request(app).get('/profile')
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('displayName')
        expect(res.body).toHaveProperty('email')
    })
    test("GET /profile/picture updates profile picture", async () => {
        const res = await request(app).put('/profile/picture').attach('picture', path.join(__dirname, 'test_image.png'))
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('profilePicture')
    })
    test('DELETE /profile/picture removes profile picture', async () => {
        const res = await request(app).delete('/profile/picture')
        expect(res.statusCode).toBe(200)
    })

    // Syllabi
    test('GET /syllabi returns array', async () => {
        const res = await request(app).get('/syllabi')
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })

    // Events (manual calendar events)
    test('POST /events creates event', async () => {
        const res = await request(app)
            .post('/events')
            .send({ title: 'New Event', startDate: '2026-04-01', type: 'other', description: '' })
        expect(res.statusCode).toBe(201)
        expect(res.body).toHaveProperty('title', 'New Event')
    })

    test('GET /events returns array', async () => {
        const res = await request(app).get('/events')
        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })

    test('PUT /events/:id updates event', async () => {
        const res = await request(app)
            .put(`/events/${testEventId}`)
            .send({ title: 'Updated Event', startDate: '2026-03-20', type: 'other', description: '' })
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('title', 'Updated Event')
    })

    test('DELETE /events/:id deletes event', async () => {
        const res = await request(app).delete(`/events/${testEventId}`)
        expect(res.statusCode).toBe(200)
    })

    // Export
    test('GET /export returns ics file', async () => {
        const res = await request(app).get('/export')
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toContain('text/calendar')
    })

    // Preferences
    test('GET /preferences returns user preferences', async () => {
        const res = await request(app).get('/preferences')
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('calendarTheme')
        expect(res.body).toHaveProperty('categoryColors')
    })

    test('PUT /preferences/theme updates theme', async () => {
        const res = await request(app)
            .put('/preferences/theme')
            .send({ calendarTheme: 'dark', calendarBackground: '', backgroundOpacity: 0.5 })
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('calendarTheme', 'dark')
    })

    test('PUT /preferences/colors updates category colors', async () => {
        const res = await request(app)
            .put('/preferences/colors')
            .send({ categoryColors: { exam: '#FF0000' } })
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('categoryColors')
    })

    test('PUT /preferences/colors/reset resets to defaults', async () => {
        const res = await request(app).put('/preferences/colors/reset')
        expect(res.statusCode).toBe(200)
        expect(res.body.categoryColors).toHaveProperty('exam', '#FF6B6B')
    })

    // Parse Grades
    test('POST /parse-grades returns grading object', async () => {
        // needs to be fixed
    })

    // Account Deletion (last — destroys the test user)
    test('DELETE /delete-account removes user and syllabi', async () => {
        const res = await request(app).delete('/delete-account')
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('message', 'Account deleted successfully.')

        const user = await User.findOne({ googleId: 'test-google-id-endpoints' })
        expect(user).toBeNull()

        const syllabi = await Syllabus.find({ userId: global.__testUser._id })
        expect(syllabi).toHaveLength(0)
    })
})
