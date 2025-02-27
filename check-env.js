const fs = require('fs');
const path = require('path');

function checkEnvironment() {
    console.log('Checking environment...');

    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found!');
        return false;
    }

    // Check required environment variables
    require('dotenv').config();
    const requiredVars = ['MONGODB_URI', 'PORT'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
        console.error('Missing environment variables:', missing.join(', '));
        return false;
    }

    // Check MongoDB URI format
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI.startsWith('mongodb')) {
        console.error('Invalid MongoDB URI format');
        return false;
    }

    console.log('Environment check passed!');
    return true;
}

module.exports = checkEnvironment; 