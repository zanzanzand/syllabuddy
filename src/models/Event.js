const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    startDate: { 
        type: Date 
    },
    endDate: { 
        type: Date
    },
    type: {
        type: String,
        // required: true
    },
    description: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, {
    timestamps: true
});

module.exports = eventSchema;
module.exports.Event = mongoose.model('Event', eventSchema);