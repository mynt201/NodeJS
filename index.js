const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { seedDatabase } = require('./utils/seed');
const userRoutes = require('./routes/userRoutes');
const wardRoutes = require('./routes/wardRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const drainageRoutes = require('./routes/drainageRoutes');
const riskRoutes = require('./routes/riskRoutes');
const roadBridgeRoutes = require('./routes/roadBridgeRoutes');
// const settingsRoutes = require('./routes/settingsRoutes'); // Settings model not implemented yet
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/drainage', drainageRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/road-bridge', roadBridgeRoutes);

// Connect to database and seed if needed
const initializeApp = async() => {
    try {
        await connectDB();

        // Seed database with default data
        await seedDatabase();
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
};

// Basic routes
app.get('/', (req, res) => {
    res.json({
        message: 'Flood Risk Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API routes are working!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
            status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            name: mongoose.connection.name || 'Not connected',
            host: mongoose.connection.host || 'Not connected'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Initialize app first, then start server
const startServer = async() => {
    try {
        // Initialize database first
        await initializeApp();

        // Start server after initialization
        const server = app.listen(PORT, () => {
            console.log(`🚀 Flood Risk Backend server is running on port ${PORT}`);
            console.log(`📍 Health check available at: http://localhost:${PORT}/api/health`);
            console.log(`🔗 API available at: http://localhost:${PORT}/api`);
        });

        module.exports = app;
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;