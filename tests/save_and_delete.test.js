require('dotenv').config()
const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')
const Syllabus = require('../src/models/Syllabus')

jest.setTimeout(30000)

describe('Syllabus Save & Delete Endpoints', () => {
    let testSyllabusId

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_CONNECTION)
    })

    afterAll(async () => {
        await Syllabus.deleteMany({ code: 'TEST101' })
        await Syllabus.deleteMany({ code: 'TEST202' })
        await mongoose.connection.close()
    })

    beforeEach(async () => {
        const doc = await Syllabus.create({
            title: 'Test Course',
            code: 'TEST101',
            instructor: 'Dr. Test',
            semester: '1st Sem 2026',
            events: [
                { title: 'Original Event', date: new Date('2026-03-15'), type: 'exam', description: 'Initial' }
            ]
        })
        testSyllabusId = doc._id.toString()
    })

    afterEach(async () => {
        await Syllabus.findByIdAndDelete(testSyllabusId)
    })

    // SAVE TESTS

    test('Save Updated Syllabus', async () => {
        const payload = {
            SyllaID: testSyllabusId,
            title: 'Test Course',
            code: 'TEST101',
            instructor: 'Dr. Test',
            semester: '1st Sem 2026',
            events: [
                { title: 'Midterm', date: '2026-03-20', type: 'exam', description: 'Covers ch 1-5' },
                { title: 'Final', date: '2026-05-10', type: 'exam', description: 'Comprehensive' },
            ]
        }

        const res = await request(app)
            .post('/syllabus/save')
            .send(payload)
            .set('Content-Type', 'application/json')

        expect(res.statusCode).toBe(200)
        expect(res.body._id).toBe(testSyllabusId)
        expect(res.body.events).toHaveLength(2)
        expect(res.body.events[0].title).toBe('Midterm')
        expect(res.body.events[1].title).toBe('Final')
    })

    test('Reject Syllabus without Events', async () => {
        const payload = {
            SyllaID: testSyllabusId,
            title: 'Test Course',
            code: 'TEST101',
            instructor: 'Dr. Test',
            semester: '1st Sem 2026',
            events: []
        }

        const res = await request(app)
            .post('/syllabus/save')
            .send(payload)

        expect(res.statusCode).toBe(400)
        expect(res.body.error).toBe('At least one event is required.')
    })

    test('Return 404 if ID is not found', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString()
        const payload = {
            SyllaID: fakeId,
            title: 'Ghost',
            code: 'TEST202',
            instructor: 'Nobody',
            semester: 'N/A',
            events: [{ title: 'Event', date: '2026-01-01', type: 'other', description: '' }]
        }

        const res = await request(app)
            .post('/syllabus/save')
            .send(payload)

        expect(res.statusCode).toBe(404)
        expect(res.body.error).toBe('Syllabus not found.')
    })

    test('Return 500 if SyllaID incorrect data type/invalid', async () => {
        const payload = {
            SyllaID: 'not-a-valid-id',
            title: 'Test',
            code: 'TEST202',
            instructor: 'Test',
            semester: 'Test',
            events: [{ title: 'Event', date: '2026-01-01', type: 'other', description: '' }]
        }

        const res = await request(app)
            .post('/syllabus/save')
            .send(payload)

        expect(res.statusCode).toBe(500)
    })

    // DELETE TESTS

    test('Delete Syllabus by ID', async () => {
        const res = await request(app).delete('/syllabus/delete/' + testSyllabusId)

        expect(res.statusCode).toBe(200)

        const check = await Syllabus.findById(testSyllabusId)
        expect(check).toBeNull()
    })

    test('Return 404 if Syllabus not Found', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString()
        const res = await request(app).delete('/syllabus/delete/' + fakeId)

        expect(res.statusCode).toBe(404)
    })

    test('Return 500 for Invalid ID in Request', async () => {
        const res = await request(app).delete('/syllabus/delete/not-a-valid-id')
        expect(res.statusCode).toBe(500)
    })
})