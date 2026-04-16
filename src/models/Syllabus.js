const mongoose = require('mongoose');
const eventSchema = require('./Event.js')

const syllabusSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    semester: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    events: [eventSchema],
}, {
    timestamps: true
});

const Syllabus = mongoose.model('Syllabus', syllabusSchema);
module.exports = Syllabus