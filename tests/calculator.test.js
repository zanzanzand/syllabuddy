require('dotenv').config()
const request = require('supertest')
const app = require('../src/app')
const path = require('path')
const mongoose = require('mongoose')

// Mock syllabus parser to return known grade weights
jest.mock('../src/llm/date_parser', () => ({
    parseSyllabus: jest.fn().mockResolvedValue({
        course_title: "THE ECONOMY, SOCIETY, AND SUSTAINABLE DEVELOPMENT",
        course_code: "SOCSC 13",
        instructor: "Asst. Prof. Genesis Kelly S. Lontoc",
        semester: "Second",
        events: [{ title: 'Course Introduction', startDate: new Date('2026-01-07'), type: 'lecture', description: ''}]
    }),
    parseGradeWeights: jest.fn().mockResolvedValue({
        grading: {
            exam: 35,
            recitation: 10,
            project: 30,
            assignment: 25,
            quiz: null,
            other: null
        }
    })
}))
jest.setTimeout(120000)

describe("Grade Calculator Backend Tests", () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_CONNECTION)

        global.__testUser = {
        _id: new mongoose.Types.ObjectId(),
        displayName: "Test User",
        email: "test@test.com"
    }
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    // Syllabus upload returns correct categories and weights
    test("Upload extracts correct categories and weights", async () => {
        const testFile = path.join(__dirname, 'test_file3.pdf')
        const response = await request(app).post("/upload").attach("syllabus", testFile)

        expect(response.statusCode).toBe(201)
        expect(response.body.grading).toBeDefined()
        expect(response.body.grading.exam).toBe(35)
        expect(response.body.grading.recitation).toBe(10)
        expect(response.body.grading.project).toBe(30)
        expect(response.body.grading.assignment).toBe(25)
    })

    // Weights add up to 100
    test("Weights from syllabus sum to 100", async () => {
        const testFile = path.join(__dirname, 'test_file3.pdf')
        const response = await request(app).post("/upload").attach("syllabus", testFile)

        const grading = response.body.grading
        const total = Object.values(grading).reduce((sum, val) => sum + (val || 0), 0)
        expect(total).toBe(100)
    })

})