const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    applicableTo: {
        type: [String], // e.g., ['Service', 'Product', 'Consultation'] or ['All']
        default: ['All']
    },
    maxUses: {
        type: Number,
        default: 100 // Default max usage limit
    },
    currentUses: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isFirstTimeOnly: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
