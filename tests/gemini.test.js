const request = require('supertest')
const app = require('../src/app')
const fs = require('fs')
const path = require('path')
const { parseSyllabus } = require('../src/llm/date_parser')
const sleep = () => new Promise((resolve)=> setTimeout(resolve, 20000))

jest.setTimeout(60000)


describe("Syllabuddy Gemini API Tests", () => {
    afterEach(async () => {
        console.log("Waiting 20 seconds to prevent rate limits");
        await sleep();
    })

    test("It should connect to Gemini and return valid JSON", async() => {
        const sampleText = `
        Course title: Intro to Testing \n
        Code: TEST123 \n
        My name is Bon, the one who is in charge of this course and I am honored to meet you. \n
        This is for the 1st semester \n
        
        RandomTestNumero1 \n
        
        This is a random exam meant to test your abilities in parsing \n
        It will consist of 2000067 tests to train your brain! \n
        randomtestnumero1 will be done on mar 13 2026 \n
        `

        const dummyBuffer = Buffer.from(sampleText, "utf-8")
        const response = await parseSyllabus(dummyBuffer, "text/plain")
        
        expect(response).toHaveProperty("course_title")
        expect(response).toHaveProperty("course_code")
        expect(response).toHaveProperty("instructor")
        expect(response).toHaveProperty("semester")

        expect(Array.isArray(response.events)).toBe(true)
        expect(response.events[0].date).toBe("2026-03-13")

    })

    test("This should return date as null", async() => {
        const sampleText = `
        Course title: Intro to Testing \n
        Code: TEST123 \n
        My name is Bon, the one who is in charge of this course and I am honored to meet you. \n
        This is for the 1st semester \n
        
        RandomTestNumero1 \n
        
        This is a random exam meant to test your abilities in parsing \n
        It will consist of 2000067 tests to train your brain! \n
        `
        const dummyBuffer = Buffer.from(sampleText, "utf-8")
        const response = await parseSyllabus(dummyBuffer, "text/plain")
        
        expect(response).toHaveProperty("course_title")
        expect(response).toHaveProperty("course_code")
        expect(response).toHaveProperty("instructor")
        expect(response).toHaveProperty("semester")

        expect(Array.isArray(response.events)).toBe(true)
        expect(response.events[0].date).toBe(null)
    })

    test("This should parse a real PDF file", async () => {
        const buffer = fs.readFileSync(path.join(__dirname, 'test_file.pdf'))
        const response = await parseSyllabus(buffer, "application/pdf")

        expect(response).toHaveProperty("course_title")
        expect(response).toHaveProperty("course_code")
        expect(response).toHaveProperty("instructor")
        expect(response).toHaveProperty("semester")

        expect(Array.isArray(response.events)).toBe(true)
        expect(response.body.events[0].date).toContain("2026-01-09")
        expect(response.body.events[5].type).toBe("consultation")
        expect(response.body.events[6].title).toBe("Lecture-Discussion: Platonic Ethics")
    })

    test("This should parse multiple events with correct dates", async () => {
        const sampleText = `
            Course: Advanced Testing TEST456
            Professor: Bon
            Semester: 2nd Sem 2026
            Midterm exam on April 15 2026
            Final exam on June 10 2026
        `
        const buffer = Buffer.from(sampleText, "utf-8")
        const response = await parseSyllabus(buffer, "text/plain")
        
        expect(response.events.length).toBe(2)
        expect(response.events.some(e => e.date === "2026-04-15")).toBe(true)
        expect(response.events.some(e => e.date === "2026-06-10")).toBe(true)
    })

    test("This should error since first arg is not a buffer", async() => {
        const sampleText = "BELO!"

        await expect(parseSyllabus(sampleText, "text/plain")).rejects.toThrow();
    })

    test("This should error since second arg is not valid mimetype", async() => {
        const sampleText = "BELO!"
        const dummyBuffer = Buffer.from(sampleText, "utf-8")

        await expect(parseSyllabus(dummyBuffer, "adgjkdagadklvkl")).rejects.toThrow();
    })
})