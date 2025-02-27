module.exports = {
    port: process.env.PORT || 3002,
    mongoUri: process.env.MONGODB_URI,
    webPort: 8080,
    environment: process.env.NODE_ENV || 'development'
}; 