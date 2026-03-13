const mongoose = require('mongoose');
const eventSchema = require('./Event.js')

const syllabusSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    code: {
        type: String,
        require: true
    },
    instructor: {
        type: String,
        require: true
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