const { spawn } = require('child_process');
const path = require('path');
const liveServer = require('live-server');
const checkEnvironment = require('./check-env');

// Function to start MongoDB server
async function startMongoDB() {
    console.log('Starting MongoDB server...');
    
    return new Promise((resolve, reject) => {
        // Start the server process
        const serverProcess = spawn('node', ['server.js'], {
            stdio: 'inherit'
        });

        serverProcess.on('error', (err) => {
            console.error('Failed to start server process:', err);
            reject(err);
        });

        // Give the server some time to start
        setTimeout(() => {
            console.log('MongoDB server started');
            resolve(true);
        }, 3000);
    });
}

// Function to start the web server
function startWebServer() {
    console.log('Starting web server...');
    
    try {
        const params = {
            port: 8080,
            host: "localhost",
            root: ".",
            open: true,
            file: "index.html",
            wait: 1000,
            logLevel: 2,
            middleware: [(req, res, next) => {
                // Add CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                next();
            }]
        };

        liveServer.start(params);
        console.log('Web server started successfully');
        return true;
    } catch (error) {
        console.error('Failed to start web server:', error);
        return false;
    }
}

// Main startup function
async function startApplication() {
    try {
        console.log('Starting Pathotricks Application...');

        // Check environment first
        if (!checkEnvironment()) {
            throw new Error('Environment check failed');
        }

        // Start MongoDB server
        await startMongoDB();
        
        // Start web server after MongoDB is ready
        const webStarted = startWebServer();
        if (!webStarted) {
            throw new Error('Web server failed to start');
        }

        console.log('Application started successfully!');
        console.log('Web interface: http://localhost:8080');
        console.log('API server: http://localhost:3002');

    } catch (error) {
        console.error('Error starting application:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down application...');
    process.exit();
});

// Start everything
startApplication();