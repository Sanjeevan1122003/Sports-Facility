const mongoose = require('mongoose');

const PricingRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['peak_hour', 'weekend', 'holiday', 'special_event', 'seasonal'],
        required: true
    },
    description: {
        type: String
    },
    applyTo: {
        type: String,
        enum: ['all', 'specific_courts', 'specific_sports'],
        default: 'all'
    },
    courts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court'
    }],
    dayOfWeek: [{
        type: Number,
        min: 0,
        max: 6
    }],
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    startTime: {
        type: String
    },
    endTime: {
        type: String
    },
    multiplier: {
        type: Number,
        default: 1
    },
    fixedSurcharge: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('PricingRule', PricingRuleSchema);