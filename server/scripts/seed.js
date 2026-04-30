const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Coupon = require('../models/Coupon');

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coupontask');
        console.log('MongoDB Connected for Seeding');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const sampleCoupons = [
    {
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 500,
        applicableTo: ['All'],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isFirstTimeOnly: false
    },
    {
        code: 'FLAT100',
        discountType: 'flat',
        discountValue: 100,
        minOrderValue: 0,
        applicableTo: ['Service'], // only Service
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isFirstTimeOnly: false
    },
    {
        code: 'NEWUSER',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 0,
        applicableTo: ['All'],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isFirstTimeOnly: true // first time only
    },
    {
        code: 'EXPIRE50',
        discountType: 'flat',
        discountValue: 50,
        minOrderValue: 0,
        applicableTo: ['All'],
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Active for 90 days
        isFirstTimeOnly: false
    }
];

const seedDB = async () => {
    await connectDB();
    try {
        await Coupon.deleteMany({});
        console.log('Cleared existing coupons.');
        await Coupon.insertMany(sampleCoupons);
        console.log('Sample coupons inserted successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDB();
