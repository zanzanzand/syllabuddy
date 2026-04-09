const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    calendarTheme: {
        type: String,
        enum: ['light', 'dark', 'high-contrast'],
        default: 'light'
    },
    calendarBackground: {
        type: String,
        default: ''
    },
    backgroundOpacity: {
        type: Number,
        default: 1,
        min: 0,
        max: 1
    },
    categoryColors: {
        type: Map,
        of: String,
        default: {
            'exam': '#FF6B6B',
            'assignment': '#4ECDC4',
            'project': '#45B7D1',
            'quiz': '#96CEB4',
            'other': '#DDA0DD' 
        }
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;