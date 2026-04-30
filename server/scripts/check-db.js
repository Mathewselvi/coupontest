const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');
        const leads = await mongoose.connection.db.collection('leads').countDocuments();
        console.log('Leads count:', leads);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}
check();
