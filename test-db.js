require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');
        console.log('URI:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connection successful!');
        
        await mongoose.connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('Connection failed:', error);
    }
    process.exit();
}

testConnection(); 