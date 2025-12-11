const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['indoor', 'outdoor'],
        required: true
    },
    sportType: {
        type: String,
        enum: ['badminton', 'tennis', 'basketball', 'squash'],
        default: 'badminton'
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active'
    },
    amenities: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Court', CourtSchema);