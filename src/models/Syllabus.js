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
    grading: {
        exam: { 
            type: Number, 
            default: null
        },
        assignment: { 
            type: Number, 
            default: null
        },
        project: { 
            type: Number, 
            default: null
        },
        quiz: { 
            type: Number, 
            default: null
        },
        recitation: { 
            type: Number, 
            default: null
        },
        other: { 
            type: Number, 
            default: null
        }
    }
}, {
    timestamps: true
});

const Syllabus = mongoose.model('Syllabus', syllabusSchema);
module.exports = Syllabus