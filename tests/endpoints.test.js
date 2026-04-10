require('dotenv').config()
const request = require('supertest')
const app = require('../src/app')
const path = require('path')
const mongoose = require('mongoose')

jest.mock('../src/llm/date_parser', () => ({
    parseSyllabus: jest.fn().mockResolvedValue({
        course_title: "Philosophy of Ethics",
        course_code: "PHIL101",
        instructor: "Dr. Smith",
        semester: "1st Semester 2026",
        events: [
            { title: "First Day", date: "2026-01-09", type: "class", description: "Introduction" },
            { title: "Event 2", date: "2026-01-16", type: "class", description: "" },
            { title: "Event 3", date: "2026-01-23", type: "class", description: "" },
            { title: "Event 4", date: "2026-01-30", type: "class", description: "" },
            { title: "Event 5", date: "2026-02-06", type: "class", description: "" },
            { title: "Office Hours", date: "2026-02-13", type: "consultation", description: "By appointment" },
            { title: "Lecture-Discussion: Platonic Ethics", date: "2026-02-20", type: "class", description: "" },
        ]
    })
}))

jest.setTimeout(120000)

describe("Syllabuddy Backend Endpoint Tests", () => {
    beforeAll(async() => {
        await mongoose.connect(process.env.MONGODB_CONNECTION)
    })

    afterAll(async() => {
        await mongoose.connection.close()
    })

    test("Homepage Test", async() => {
        const response = await request(app).get("/")
        expect(response.statusCode).toBe(200);
    })
    test("Google Login Page", async() => {
        const response = await request(app).get("/auth/google")
        expect(response.statusCode).toBe(302);
    })
    test("Google Login Callback", async() => {
        const response = await request(app).get("/auth/google/callback")
        expect(response.statusCode).toBe(302);
    })
    test("Logout", async() => {
        const response = await request(app).get("/logout")
        expect(response.statusCode).toBe(302);
    })
    test("Upload", async() => {
        const testFile = path.join(__dirname, 'test_file.pdf')
        const response = await request(app).post("/upload").attach("syllabus", testFile)

        

        expect(response.statusCode).toBe(201)
    
        expect(response.body).toHaveProperty("title")
        expect(response.body).toHaveProperty("code")
        expect(response.body).toHaveProperty("instructor")
        expect(response.body).toHaveProperty("semester")

        expect(Array.isArray(response.body.events)).toBe(true)
        expect(response.body.events[0].date).toContain("2026-01-09")
        expect(response.body.events[5].type).toBe("consultation")
        expect(response.body.events[6].title).toBe("Lecture-Discussion: Platonic Ethics")

    })
    test("Reject Upload if no File", async () => {
        const response = await request(app).post("/upload")
        expect(response.statusCode).toBe(400)
        expect(response.body.error).toBe("No file uploaded.")
    })
})
