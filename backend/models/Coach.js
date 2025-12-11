const mongoose = require('mongoose');

const CoachSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    sportSpecialization: [{
        type: String,
        enum: ['badminton', 'tennis', 'basketball', 'squash']
    }],
    hourlyRate: {
        type: Number,
        required: true,
        min: 0
    },
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ 
        },
        endTime: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    status: {
        type: String,
        enum: ['available', 'unavailable', 'on_leave'],
        default: 'available'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    experience: {
        type: Number,
        min: 0
    },
    description: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    totalSessions: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

CoachSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Coach', CoachSchema);