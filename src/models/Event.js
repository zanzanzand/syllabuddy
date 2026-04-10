const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
     start: { 
        type: String 
    },

    end: { 
        type: String 
    },

    date: {
        type: Date,
    },
    
    type: {
        type: String,
        // required: true
    },
    description: {
        type: String,
    },
    // grading: gradeSchema,
}, {
    timestamps: true
});

module.exports = eventSchema;
module.exports.Event = mongoose.model('Event', eventSchema);