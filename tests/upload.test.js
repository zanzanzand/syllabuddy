require('dotenv').config()
const request = require('supertest')
const app = require('../src/app')
const path = require('path')
const mongoose = require('mongoose')
const Syllabus = require('../src/models/Syllabus')

jest.mock('../src/llm/date_parser', () => ({
    parseSyllabus: jest.fn().mockResolvedValue({
        course_title: "Philosophy of Ethics",
        course_code: "TEST101",
        instructor: "Dr. Smith",
        semester: "1st Semester 2026",
        events: [
            { title: "First Day", startDate: "2026-01-09", type: "lecture", description: "Introduction" },
            { title: "Event 2", startDate: "2026-01-16", type: "lecture", description: "" },
            { title: "Event 3", startDate: "2026-01-23", endDate: "2026-01-25", type: "lecture", description: "" },
            { title: "Event 4", startDate: "2026-01-30", type: "lecture", description: "" },
            { title: "Event 5", startDate: "2026-02-06", type: "lecture", description: "" },
            { title: "Office Hours", startDate: "2026-02-13", type: "consultation", description: "By appointment" },
            { title: "Lecture-Discussion: Platonic Ethics", startDate: "2026-02-20", type: "lecture", description: "" },
        ]
    }),
    parseGradeWeights: jest.fn().mockResolvedValue({
        grading: { exam: 40, assignment: 30, project: 20, quiz: 10, recitation: null, other: null }
    })
}))

jest.setTimeout(30000)

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_CONNECTION)
    global.__testUser = {
        _id: new mongoose.Types.ObjectId(),
        displayName: 'Test User',
        email: 'test@test.com'
    }
})

afterAll(async () => {
    await Syllabus.deleteMany({ code: 'PHIL101' })
    await mongoose.connection.close()
    global.__testUser = null
})

describe('POST /upload', () => {

    // User Authentication

    test('Reject unauthenticated request', async () => {
        global.__testUser = null
        const res = await request(app).post('/upload')
        expect(res.statusCode).toBe(401)
        global.__testUser = {
            _id: new mongoose.Types.ObjectId(),
            googleId: 'testestest',
            displayName: 'Test User',
            email: 'test@test.com'
        }
    })

    // File Validation

    test('Reject upload with no file', async () => {
        const res = await request(app).post('/upload')
        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe('No file uploaded.')
    })

    test('Reject unsupported file type', async () => {
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', Buffer.from('hello'), { filename: 'test.txt', contentType: 'text/plain' })
        expect(res.statusCode).toBe(400)
    })

    test('Reject files over 10MB', async () => {
        const bigBuffer = Buffer.alloc(11 * 1024 * 1024)
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', bigBuffer, { filename: 'big.pdf', contentType: 'application/pdf' })
        expect(res.statusCode).toBe(400)
    })

    test('Reject upload if parser returns no events', async () => {
        const { parseSyllabus, parseGradeWeights } = jest.requireMock('../src/llm/date_parser')
        parseSyllabus.mockResolvedValueOnce({
            course_title: "Empty Course",
            course_code: "EMPTY101",
            instructor: "Dr. Nobody",
            semester: "1st Sem 2026",
            events: []
        })
        parseGradeWeights.mockResolvedValueOnce({ grading: {} })

        const testFile = path.join(__dirname, 'test_file.pdf')
        const res = await request(app).post('/upload').attach('syllabus', testFile)
        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe('No events were parsed from the syllabus.')
    })

    // Successful Upload & Response Shape

    test('Accept valid PDF and returns syllabus document', async () => {
        const testFile = path.join(__dirname, 'test_file.pdf')
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', testFile)

        expect(res.statusCode).toBe(201)
        expect(res.body).toHaveProperty('title', 'Philosophy of Ethics')
        expect(res.body).toHaveProperty('code', 'TEST101')
        expect(res.body).toHaveProperty('instructor', 'Dr. Smith')
        expect(res.body).toHaveProperty('semester', '1st Semester 2026')
    })

    test('Returned syllabus contains parsed events array', async () => {
        const testFile = path.join(__dirname, 'test_file.pdf')
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', testFile)

        expect(res.statusCode).toBe(201)
        expect(Array.isArray(res.body.events)).toBe(true)
        expect(res.body.events.length).toBe(7)
    })

    // Event Data Correctness

    test('Events have correct values', async () => {
        const testFile = path.join(__dirname, 'test_file.pdf')
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', testFile)

        expect(res.statusCode).toBe(201)
        expect(res.body.events[0].startDate).toContain('2026-01-09')
        expect(res.body.events[2].endDate).toContain('2026-01-25')
        expect(res.body.events[5].type).toBe('consultation')
        expect(res.body.events[6].title).toBe('Lecture-Discussion: Platonic Ethics')
    })

    // Grade Weight Extraction

    test('Returned syllabus contains grading breakdown', async () => {
        const testFile = path.join(__dirname, 'test_file.pdf')
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', testFile)

        expect(res.statusCode).toBe(201)
        expect(res.body.grading).toBeDefined()
        expect(res.body.grading.exam).toBe(40)
        expect(res.body.grading.assignment).toBe(30)
    })

    // Data Security (User Scoping)

    test('Saved syllabus is scoped to the authenticated user', async () => {
        const testFile = path.join(__dirname, 'test_file.pdf')
        const res = await request(app)
            .post('/upload')
            .attach('syllabus', testFile)

        expect(res.statusCode).toBe(201)
        const saved = await Syllabus.findById(res.body._id)
        expect(saved).not.toBeNull()
        expect(saved.userId.toString()).toBe(global.__testUser._id.toString())
    })
})