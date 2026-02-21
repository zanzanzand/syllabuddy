const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        require: true
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

const Event = mongoose.model('Event', eventSchema);
export default Event;