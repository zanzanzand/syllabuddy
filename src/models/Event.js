const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    date: {
        type: Date,
    },
    type: {
        type: String,
        require: true
    },
    description: {
        type: String,
    },
    // grading: gradeSchema,
}, {
    timestamps: true
});

module.exports = eventSchema;