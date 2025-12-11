const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['racket', 'shoes', 'ball', 'other'],
        required: true
    },
    totalStock: {
        type: Number,
        required: true,
        min: 0
    },
    availableStock: {
        type: Number,
        required: true,
        min: 0
    },
    rentalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['available', 'low_stock', 'unavailable'],
        default: 'available'
    }
});

module.exports = mongoose.model('Equipment', EquipmentSchema);