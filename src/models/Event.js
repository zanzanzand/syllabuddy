const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    // grading: gradeSchema,
}, {
    timestamps: true
});

module.exports = eventSchema;