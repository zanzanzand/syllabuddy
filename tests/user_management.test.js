require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const User = require('../src/models/User')
const Syllabus = require('../src/models/Syllabus')
const app = require('../src/app')

jest.setTimeout(120000)

// Dummy ID
const FAKE_GOOGLE_ID = 'google_test_user_123'

// Backdoor key
function setLoggedInUser(user) {
    global.__testUser = user
}

// "Fresh" student for every test (like after first log in)
async function createTestUser(overrides = {}) {
    const user = await User.create({
        googleId: FAKE_GOOGLE_ID,
        displayName: 'Test User',
        email: 'testuser@example.com',
        profilePicture: 'https://example.com/photo.jpg',
        calendarTheme: 'light',
        calendarBackground: '',
        backgroundOpacity: 1,
        categoryColors: {
            exam: '#FF6B6B',
            assignment: '#4ECDC4',
            project: '#45B7D1'
        },
        ...overrides
    })

    // 'photos' array
    // deleting profile pic reads array index 0 value as fallback
    user.photos = [{ value: overrides.profilePicture || 'https://example.com/photo.jpg' }]
    return user
}

// Test Suite
describe('User Management Backend Tests', () => {

    beforeAll(async () => {
        process.env.NODE_ENV = 'test' // test switch to allow backdoor
        await mongoose.connect(process.env.MONGODB_CONNECTION)
    })

    beforeEach(async () => { // wipe out leftover test user before a test starts; fresh database
        await User.deleteMany({ googleId: { $in: [FAKE_GOOGLE_ID, 'google_user_A', 'google_user_B'] } })
        await User.deleteMany({ email: { $in: ['testuser@example.com', 'usera@example.com', 'userb@example.com'] } })
    })

    afterEach(async () => {
        setLoggedInUser(null) // logout fake user
        await User.deleteMany({ googleId: { $in: [FAKE_GOOGLE_ID, 'google_user_A', 'google_user_B'] } })
        await User.deleteMany({ email: { $in: ['testuser@example.com', 'usera@example.com', 'userb@example.com'] } })
    })

    afterAll(async () => {
        await mongoose.connection.close()
    })

    // Data Security
    describe('Data Security', () => {

        test('GET /profile returns 401 if user is not logged in', async () => {
            setLoggedInUser(null)
            const res = await request(app).get('/profile')
            expect(res.statusCode).toBe(401)
            expect(res.body.error).toBe('Unauthorized. Please log in.')
        })

        test('DELETE /delete-account returns 401 if user is not logged in', async () => {
            setLoggedInUser(null)
            const res = await request(app).delete('/delete-account')
            expect(res.statusCode).toBe(401)
        })

        test('GET /preferences returns 401 if user is not logged in', async () => {
            setLoggedInUser(null)
            const res = await request(app).get('/preferences')
            expect(res.statusCode).toBe(401)
        })

        test('PUT /profile/picture returns 401 if user is not logged in', async () => {
            setLoggedInUser(null)
            const res = await request(app).put('/profile/picture')
            expect(res.statusCode).toBe(401)
        })

        test("User A cannot delete User B's syllabus", async () => {
            const userA = await createTestUser({ googleId: 'google_user_A', email: 'usera@example.com' })
            const userB = await User.create({
                googleId: 'google_user_B',
                displayName: 'User B',
                email: 'userb@example.com',
                profilePicture: ''
            })

            const userBSyllabus = await Syllabus.create({
                title: 'User B Syllabus',
                code: 'CS999',
                instructor: 'Prof B',
                semester: '1st 2026',
                userId: userB._id,
                events: []
            })

            // Log in as User A and attempt to delete User B's syllabus
            setLoggedInUser(userA)
            const res = await request(app).delete(`/syllabus/delete/${userBSyllabus._id}`)

            // app.js filters by both _id AND userId, so this should be 404 for User A
            expect(res.statusCode).toBe(404)

            // Confirm it still exists in DB
            const stillExists = await Syllabus.findById(userBSyllabus._id)
            expect(stillExists).not.toBeNull()

            // Cleanup
            await Syllabus.findByIdAndDelete(userBSyllabus._id)
            await User.findByIdAndDelete(userB._id)
        })

    })

    // Account Management (Profile View)
    describe('Account Management - Profile View', () => {

        test('GET /profile returns name, email, and profile picture of logged-in user', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app).get('/profile')
            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('displayName', 'Test User')
            expect(res.body).toHaveProperty('email', 'testuser@example.com')
            expect(res.body).toHaveProperty('profilePicture')
        })

        test('GET /profile does not expose sensitive fields like googleId', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app).get('/profile')
            expect(res.statusCode).toBe(200)
            expect(res.body).not.toHaveProperty('googleId')
            expect(res.body).not.toHaveProperty('__v')
        })

    })

    // Account Deletion
    describe('Account Deletion', () => {

        test('DELETE /delete-account removes the user from the database', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app).delete('/delete-account')
            expect(res.statusCode).toBe(200)
            expect(res.body.message).toBe('Account deleted successfully.')

            const deletedUser = await User.findById(user._id)
            expect(deletedUser).toBeNull()
        })

        test('DELETE /delete-account also deletes all syllabi belonging to the user', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            await Syllabus.create([
                { title: 'Syllabus A', code: 'CS101', instructor: 'Prof A', semester: '1st 2026', userId: user._id, events: [] },
                { title: 'Syllabus B', code: 'CS102', instructor: 'Prof B', semester: '1st 2026', userId: user._id, events: [] }
            ])

            const res = await request(app).delete('/delete-account')
            expect(res.statusCode).toBe(200)

            const remainingSyllabi = await Syllabus.find({ userId: user._id })
            expect(remainingSyllabi.length).toBe(0)
        })

    })

    // Profile Picture Management
    describe('Profile Picture Management', () => {

        test('PUT /profile/picture returns 400 if no file is attached', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app).put('/profile/picture')
            expect(res.statusCode).toBe(400)
            expect(res.body.error).toBe('No file uploaded')
        })

        test('PUT /profile/picture rejects non-JPG/PNG files with a specific error', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app)
                .put('/profile/picture')
                .attach('picture', Buffer.from('fake pdf content'), {
                    filename: 'profile.pdf',
                    contentType: 'application/pdf'
                })

            expect([400, 500]).toContain(res.statusCode)
            expect(res.body.error).toContain('Only JPG/PNG allowed')
        })

        test('DELETE /profile/picture resets profile picture to Google photo fallback', async () => {
            const user = await createTestUser({ profilePicture: 'https://example.com/custom.jpg' })
            // Set a distinct Google original to confirm the fallback is actually used
            user.photos = [{ value: 'https://google.com/original_photo.jpg' }]
            setLoggedInUser(user)

            const res = await request(app).delete('/profile/picture')
            expect(res.statusCode).toBe(200)
            expect(res.body.message).toBe('Profile picture removed.')

            // Confirm DB was updated to the Google photo, not left as the custom one
            const updatedUser = await User.findById(user._id)
            expect(updatedUser.profilePicture).toBe('https://google.com/original_photo.jpg')
        })

    })

    // Calendar Theme Customization
    describe('Calendar Theme Customization', () => {

        test('GET /preferences returns calendarTheme, calendarBackground, and backgroundOpacity', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app).get('/preferences')
            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('calendarTheme')
            expect(res.body).toHaveProperty('calendarBackground')
            expect(res.body).toHaveProperty('backgroundOpacity')
        })

        test('PUT /preferences/theme updates the calendar theme successfully', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app)
                .put('/preferences/theme')
                .send({ calendarTheme: 'dark', calendarBackground: '', backgroundOpacity: 0.8 })

            expect(res.statusCode).toBe(200)
            expect(res.body.calendarTheme).toBe('dark')
            expect(res.body.backgroundOpacity).toBe(0.8)
        })

        test('PUT /preferences/theme persists the updated theme in the database', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            await request(app)
                .put('/preferences/theme')
                .send({ calendarTheme: 'high-contrast', calendarBackground: '', backgroundOpacity: 1 })

            const updatedUser = await User.findById(user._id)
            expect(updatedUser.calendarTheme).toBe('high-contrast')
        })

    })

    // Category Color Coding
    describe('Category Color Coding', () => {

        test('GET /preferences returns categoryColors', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app).get('/preferences')
            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('categoryColors')
        })

        test('PUT /preferences/colors updates category colors successfully', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            const res = await request(app)
                .put('/preferences/colors')
                .send({ categoryColors: { exam: '#FF0000', assignment: '#00FF00' } })

            expect(res.statusCode).toBe(200)
            expect(res.body).toHaveProperty('categoryColors')
        })

        test('PUT /preferences/colors/reset restores default brand colors', async () => {
            const user = await createTestUser()
            setLoggedInUser(user)

            // First set a custom color
            await request(app)
                .put('/preferences/colors')
                .send({ categoryColors: { exam: '#000000' } })

            // Then reset
            const res = await request(app).put('/preferences/colors/reset')
            expect(res.statusCode).toBe(200)
            expect(res.body.categoryColors.exam).toBe('#FF6B6B')
            expect(res.body.categoryColors.assignment).toBe('#4ECDC4')
            expect(res.body.categoryColors.project).toBe('#45B7D1')
        })

    })

})