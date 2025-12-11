const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 0.5,
        max: 4
    },
    equipment: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment'
        },
        quantity: {
            type: Number,
            min: 1
        }
    }],
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    pricingBreakdown: {
        basePrice: {
            type: Number,
            required: true
        },
        peakHourFee: {
            type: Number,
            default: 0
        },
        weekendFee: {
            type: Number,
            default: 0
        },
        equipmentFee: {
            type: Number,
            default: 0
        },
        coachFee: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    },
    notes: {
        type: String
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

BookingSchema.index({ court: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ user: 1 });
BookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);