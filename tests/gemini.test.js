const request = require('supertest')
const app = require('../src/app')
const fs = require('fs')
const path = require('path')
const { parseSyllabus, parseGradeWeights } = require('../src/llm/date_parser')
const sleep = () => new Promise((resolve)=> setTimeout(resolve, 40000))

jest.setTimeout(180000)


describe("Syllabuddy Gemini Tests", () => {
    afterEach(async () => {
        console.log("Waiting 40 seconds to prevent rate limits");
        await sleep();
    })

    // Gemini Connection

    test('Connect to Gemini and return valid JSON', async () => {
        const sampleText = `
        Course title: Intro to Testing
        Code: TEST123
        My name is Bon, the one who is in charge of this course and I am honored to meet you.
        This is for the 1st semester
        RandomTestNumero1
        This is a random exam meant to test your abilities in parsing
        It will consist of 2000067 tests to train your brain!
        randomtestnumero1 will be done on mar 13 2026
        `
        const dummyBuffer = Buffer.from(sampleText, 'utf-8')
        const response = await parseSyllabus(dummyBuffer, 'text/plain')

        expect(response).toHaveProperty('course_title')
        expect(response).toHaveProperty('course_code')
        expect(response).toHaveProperty('instructor')
        expect(response).toHaveProperty('semester')
        expect(Array.isArray(response.events)).toBe(true)
        expect(response.events[0].startDate).toBe('2026-03-13')
    })

    // Input Validation

    test("Return error since first arg is not a buffer", async() => {
        const sampleText = "BELO!"

        await expect(parseSyllabus(sampleText, "text/plain")).rejects.toThrow();
    })

    test("Return error since second arg is not valid mimetype", async() => {
        const sampleText = "BELO!"
        const dummyBuffer = Buffer.from(sampleText, "utf-8")

        await expect(parseSyllabus(dummyBuffer, "adgjkdagadklvkl")).rejects.toThrow();
    })

    // Null Date Handling

    test("Return date as null", async() => {
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
        expect(response.events[0].startDate).toBe(null)
    })

    // Multiple Event Extraction

    test("Should parse multiple events with correct dates", async () => {
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
        expect(response.events.some(e => e.startDate === "2026-04-15")).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-06-10")).toBe(true)
    })

    // Real File Parsing

    test("Should parse a real PDF file (PHILO 13)", async () => {
        const buffer = fs.readFileSync(path.join(__dirname, 'test_file.pdf'))
        const response = await parseSyllabus(buffer, "application/pdf")
        const grades = await parseGradeWeights(buffer, "application/pdf")

        expect(response).toHaveProperty("course_title")
        expect(response).toHaveProperty("course_code")
        expect(response).toHaveProperty("instructor")
        expect(response).toHaveProperty("semester")

        expect(Array.isArray(response.events)).toBe(true)
        expect(response.events[0].startDate).toContain("2026-01-09")
        expect(response.events[5].type).toBe("consultation")
        expect(response.events[6].title).toBe("Lecture-Discussion: Platonic Ethics")

        expect(grades).toHaveProperty("grading")
        expect(grades.grading.assignment).toBe(60)
        expect(grades.grading.project).toBe(40)
        const total = Object.values(grades.grading).reduce(function(sum, val) {
            return sum + (val || 0)
        }, 0)
        expect(total).toBe(100)
    })

    test("Should parse a real PDF file (NSTP12)", async () => {
        const buffer = fs.readFileSync(path.join(__dirname, 'test_file2.pdf'))
        const response = await parseSyllabus(buffer, "application/pdf")
        const grades = await parseGradeWeights(buffer, "application/pdf")

        expect(response).toHaveProperty("course_title")
        expect(response).toHaveProperty("course_code")
        expect(response).toHaveProperty("instructor")
        expect(response).toHaveProperty("semester")

        expect(response.course_title).toBe("Civic Welfare Training Service")
        expect(response.instructor).toBe("Reginales, Jonathan")

        expect(Array.isArray(response.events)).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-01-14" )).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-02-11" )).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-04-08" )).toBe(true)

        expect(grades).toHaveProperty("grading")
        const total = Object.values(grades.grading).reduce(function(sum, val) {
            return sum + (val || 0)
        }, 0)
        expect(total).toBe(100)
    })

    test("Should parse a real PDF file (SOCSC13)", async () => {
        const buffer = fs.readFileSync(path.join(__dirname, 'test_file3.pdf'))
        const response = await parseSyllabus(buffer, "application/pdf")
        const grades = await parseGradeWeights(buffer, "application/pdf")

        expect(response).toHaveProperty("course_title")
        expect(response).toHaveProperty("course_code")
        expect(response).toHaveProperty("instructor")
        expect(response).toHaveProperty("semester")

        expect(response.course_code).toBe("SOCSC 13")
        expect(response.instructor).toBe("Asst. Prof. Genesis Kelly S. Lontoc")

        expect(Array.isArray(response.events)).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-03-14" )).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-03-19" )).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-04-23" )).toBe(true)
        expect(response.events.some(e => e.startDate === "2026-04-30" )).toBe(true)
        expect(response.events.some(e => e.type === "exam" )).toBe(true)

        expect(grades).toHaveProperty("grading")
        expect(grades.grading.exam).toBe(35)
        const total = Object.values(grades.grading).reduce(function(sum, val) {
            return sum + (val || 0)
        }, 0)
        expect(total).toBe(100)
    })

    // Type Categorization 

    test('Categorize events by type correctly', async () => {
        const sampleText = `
        Course: Software Design CSCI99
        Professor: Dr. Santos
        Semester: 1st Sem 2026
        Midterm Exam on March 10 2026
        Final Exam on May 20 2026
        Assignment 1 due February 5 2026
        Group Project submission on April 30 2026
        `
        const buffer = Buffer.from(sampleText, 'utf-8')
        const response = await parseSyllabus(buffer, 'text/plain')

        expect(response.events.some(e => e.type === 'exam' )).toBe(true)
        expect(response.events.some(e => e.type === 'assignment' )).toBe(true)
        expect(response.events.some(e => e.type === 'project' )).toBe(true)
    })

    // Grade Weight 

    test('Should extract grade weights from syllabus', async () => {
        const sampleText = `
        Course: Algorithms CSCI200
        Professor: Dr. Reyes
        Grading:
        Exams - 40%
        Assignments - 30%
        Projects - 20%
        Quizzes - 10%
        `
        const buffer = Buffer.from(sampleText, 'utf-8')
        const response = await parseGradeWeights(buffer, 'text/plain')

        expect(response).toHaveProperty('grading')
        expect(response.grading.exam).toBe(40)
        expect(response.grading.assignment).toBe(30)
        expect(response.grading.project).toBe(20)
        expect(response.grading.quiz).toBe(10)
    })

    test('Should return null for unmentioned grade categories', async () => {
        const sampleText = `
        Course: Intro to Ethics PHIL10
        Professor: Dr. Cruz
        Grading:
        Exams - 60%
        Assignments - 40%
        `
        const buffer = Buffer.from(sampleText, 'utf-8')
        const response = await parseGradeWeights(buffer, 'text/plain')

        expect(response.grading.exam).toBe(60)
        expect(response.grading.assignment).toBe(40)
        expect(response.grading.project).toBeNull()
        expect(response.grading.quiz).toBeNull()
    })
    
})