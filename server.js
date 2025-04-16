require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Patient = require('./models/Patient');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
    credentials: true
}));

// Add headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Cache-Control');
    res.header('Content-Type', 'application/json');
    next();
});

// MongoDB Connection
mongoose.set('strictQuery', false);

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 2000; // 2 seconds

const connectDB = async (retryCount = 0) => {
    try {
        console.log(`Attempting to connect to MongoDB (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'pathotricks',
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying in ${RETRY_INTERVAL/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            return connectDB(retryCount + 1);
        } else {
            console.error('Max retries reached. Could not connect to MongoDB.');
            return false;
        }
    }
};

// Routes
app.get('/api/patients', async (req, res) => {
    try {
        const { dateRange, status, searchQuery } = req.query;
        let query = {};

        // Date filter
        if (dateRange && dateRange !== 'all') {
            const today = new Date();
            const startDate = new Date();
            
            switch(dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    query.date = { $gte: startDate, $lte: today };
                    break;
                case 'week':
                    startDate.setDate(today.getDate() - 7);
                    query.date = { $gte: startDate, $lte: today };
                    break;
                case 'month':
                    startDate.setMonth(today.getMonth() - 1);
                    query.date = { $gte: startDate, $lte: today };
                    break;
            }
        }

        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search query
        if (searchQuery) {
            query.$or = [
                { patientName: { $regex: searchQuery, $options: 'i' } },
                { serialNumber: { $regex: searchQuery, $options: 'i' } },
                { contactNumber: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        console.log('Fetching patients with query:', query);

        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        // Log the first patient for verification
        if (patients.length > 0) {
            console.log('Latest patient:', {
                serialNumber: patients[0].serialNumber,
                name: patients[0].patientName,
                date: patients[0].date
            });
        }

        console.log(`Found ${patients.length} patients`);
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ 
            error: 'Failed to fetch patients',
            details: error.message 
        });
    }
});

// Update the validation middleware
const validateSerialNumber = (req, res, next) => {
    const { serialNumber } = req.body;
    if (!serialNumber) {
        return res.status(400).json({
            success: false,
            message: 'Serial number is required'
        });
    }

    // Clean the serial number
    const cleanSerialNumber = serialNumber.trim().replace(/\s+/g, '');
    
    // Check format PT-YYYYMMDDXXXXX or PTYYYYMMDDXXXXX
    if (!/^PT[-]?\d{8}\d{5}$/.test(cleanSerialNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid serial number format. Expected format: PT-YYYYMMDDXXXXX'
        });
    }

    // Extract date and count (handle both formats)
    const dateStr = cleanSerialNumber.slice(cleanSerialNumber.indexOf('PT') + 2).replace('-', '').slice(0, 8);
    const count = parseInt(cleanSerialNumber.slice(-5));
    
    // Validate count is not above 99999
    if (count > 99999) {
        return res.status(400).json({
            success: false,
            message: 'Patient number exceeds daily limit'
        });
    }

    // Validate date
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month - 1, day);
    
    const isValidDate = !isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        (date.getMonth() + 1) === month &&
        date.getDate() === day;

    if (!isValidDate) {
        return res.status(400).json({
            success: false,
            message: 'Invalid date in serial number'
        });
    }

    // Standardize the format with hyphen
    req.body.serialNumber = `PT-${dateStr}${count.toString().padStart(5, '0')}`;
    next();
};

// Add the middleware to your route
app.post('/api/patients', validateSerialNumber, async (req, res) => {
    try {
        console.log('Received patient data:', req.body);

        // Validate required fields
        const requiredFields = ['serialNumber', 'patientName', 'age', 'gender', 'contactNumber', 'selectedTests'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Create new patient
        const patient = new Patient(req.body);
        
        // Save to database
        const savedPatient = await patient.save();
        console.log('Patient saved successfully:', savedPatient);

        // Send response
        res.status(201).json({
            success: true,
            message: 'Patient saved successfully',
            data: savedPatient
        });
    } catch (error) {
        console.error('Error saving patient:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save patient data'
        });
    }
});

// Update patient status
app.put('/api/patients/:id/status', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(patient);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/statistics', async (req, res) => {
    try {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get total patients for current month
        const totalPatients = await Patient.countDocuments({
            date: { $gte: firstDayOfMonth }
        });

        // Get total tests conducted
        const testsData = await Patient.aggregate([
            { $match: { date: { $gte: firstDayOfMonth } } },
            { $unwind: "$selectedTests" },
            { $group: { _id: null, total: { $sum: 1 } } }
        ]);

        // Get total revenue
        const revenueData = await Patient.aggregate([
            { $match: { date: { $gte: firstDayOfMonth } } },
            { $group: { _id: null, total: { $sum: "$finalAmount" } } }
        ]);

        console.log('Statistics:', {
            totalPatients,
            totalTests: testsData[0]?.total || 0,
            totalRevenue: revenueData[0]?.total || 0
        });

        res.json({
            totalPatients,
            totalTests: testsData[0]?.total || 0,
            totalRevenue: revenueData[0]?.total || 0
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch statistics',
            details: error.message 
        });
    }
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Add this test route
app.get('/test/db', async (req, res) => {
    try {
        // Test database connection
        const dbState = mongoose.connection.readyState;
        const dbStatus = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        // Try to create a test document
        const testPatient = new Patient({
            serialNumber: `TEST${Date.now()}`,
            patientName: 'Test Patient',
            age: 30,
            gender: 'male',
            contactNumber: '1234567890',
            selectedTests: [{ name: 'Test', price: 100 }],
            totalAmount: 100,
            discountAmount: 0,
            finalAmount: 100
        });

        await testPatient.save();
        await Patient.findByIdAndDelete(testPatient._id);

        res.json({
            status: 'success',
            database: {
                state: dbStatus[dbState],
                host: mongoose.connection.host,
                name: mongoose.connection.name
            },
            testWrite: 'successful'
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            details: {
                name: error.name,
                code: error.code
            }
        });
    }
});

// Add test route
app.get('/test/connection', async (req, res) => {
    try {
        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        // Get database name
        const dbName = mongoose.connection.name;
        
        // Get collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        // Get count of documents in Patient collection
        const patientCount = await Patient.countDocuments();

        res.json({
            status: 'success',
            connection: {
                state: 'connected',
                database: dbName,
                collections: collections.map(c => c.name)
            },
            patients: {
                count: patientCount
            }
        });
    } catch (error) {
        console.error('Connection test error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Add verification route
app.get('/api/verify/:serialNumber', async (req, res) => {
    try {
        const { serialNumber } = req.params;
        console.log('Verifying patient:', serialNumber);

        const patient = await Patient.findOne({ serialNumber }).lean();
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        console.log('Found patient:', patient);
        res.json({
            success: true,
            data: patient
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update the route to get single patient data
app.get('/api/patients/:id', async (req, res) => {
    try {
        // Set proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');

        const { id } = req.params;
        console.log('Fetching patient with ID:', id);

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid patient ID format'
            });
        }

        // Find patient
        const patient = await Patient.findById(id).lean();
        console.log('Found patient:', patient ? 'Yes' : 'No');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Process patient data
        const patientData = {
            ...patient,
            selectedTests: patient.selectedTests.map(test => ({
                ...test,
                result: test.result || 'Pending',
                normalRange: test.normalRange || getDefaultRange(test.name),
                units: test.units || getDefaultUnits(test.name),
                status: test.status || 'pending'
            }))
        };

        // Send response
        return res.json({
            success: true,
            data: patientData
        });

    } catch (error) {
        console.error('Error fetching patient:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add endpoint to generate next serial number
app.get('/api/next-serial-number', async (req, res) => {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // Find the highest serial number for today (with or without hyphen)
        const latestPatient = await Patient.findOne({
            serialNumber: new RegExp(`^PT-?${dateStr}`)
        }).sort({ serialNumber: -1 });
        
        let nextNumber = 1;
        if (latestPatient) {
            // Extract the number from the last 5 digits
            const lastNumber = parseInt(latestPatient.serialNumber.slice(-5));
            nextNumber = lastNumber + 1;
            
            if (nextNumber > 99999) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum patient limit reached for today'
                });
            }
        }
        
        // Always generate with hyphen
        const serialNumber = `PT-${dateStr}${String(nextNumber).padStart(5, '0')}`;
        
        res.json({
            success: true,
            serialNumber: serialNumber
        });
    } catch (error) {
        console.error('Error generating serial number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate serial number'
        });
    }
});

// Helper functions for default values
function getDefaultRange(testName) {
    const ranges = {
        'Albumin': '3.5-5.5',
        'Alkaline Phosphate': '44-147',
        'Amylase': '28-100',
        'Bilirubin': '0.3-1.2',
        'Blood Group': 'N/A',
        'Cholesterol': '150-200',
        // Add more default ranges
    };
    return ranges[testName] || '--';
}

function getDefaultUnits(testName) {
    const units = {
        'Albumin': 'g/dL',
        'Alkaline Phosphate': 'IU/L',
        'Amylase': 'U/L',
        'Bilirubin': 'mg/dL',
        'Blood Group': '',
        'Cholesterol': 'mg/dL',
        // Add more default units
    };
    return units[testName] || '--';
}

// Add route to update test results
app.put('/api/patients/:id/test-results', async (req, res) => {
    try {
        const { testResults } = req.body;
        
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Update test results
        patient.selectedTests = patient.selectedTests.map(test => {
            const updatedTest = testResults.find(t => t.name === test.name);
            if (updatedTest) {
                test.result = updatedTest.result;
                test.status = updatedTest.status;
            }
            return test;
        });

        patient.reportGeneratedAt = new Date();
        await patient.save();

        res.json({
            success: true,
            message: 'Test results updated successfully',
            data: patient
        });
    } catch (error) {
        console.error('Error updating test results:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message
    });
});

// Add patient verification route
app.get('/api/verify/patient/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({
                success: true,
                exists: false,
                message: 'Invalid ID format'
            });
        }

        // Check if patient exists
        const exists = await Patient.exists({ _id: id });
        
        res.json({
            success: true,
            exists: !!exists
        });
    } catch (error) {
        console.error('Patient verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add test route
app.get('/api/test', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        success: true,
        message: 'Server is working'
    });
});

// Start server
const startServer = async () => {
    try {
        const isConnected = await connectDB();
        if (!isConnected) {
            console.error('Could not establish database connection. Server will not start.');
            return;
        }
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Web interface available at http://localhost:8080`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

// Add error handlers
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

startServer();
