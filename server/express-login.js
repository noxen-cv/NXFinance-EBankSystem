/**
 * Express-based login handler for NXFinance
 * This server handles authentication with proper CORS
 */
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware for logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Log body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
        let body = req.body ? JSON.stringify(req.body) : '(no body)';
        if (body.includes('password')) {
            body = body.replace(/"password":"[^"]*"/g, '"password":"[REDACTED]"');
        }
        console.log('Request body:', body);
    }
    
    next();
});

// Configure CORS - IMPORTANT for browser fetch requests
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

// Configure body parser for JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API test endpoint
app.get('/api/auth/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API connection is working',
        timestamp: new Date().toISOString(),
        server: 'NXFinance Express API'
    });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login request received');
        
        // Check for required fields
        if (!req.body || !req.body.email || !req.body.password) {
            return res.status(400).json({
                error: 'Email and password are required',
                fieldsReceived: req.body ? Object.keys(req.body) : []
            });
        }

        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);
        
        // Find user by email
        let client;
        try {
            client = await pool.connect();
            const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            
            if (result.rows.length === 0) {
                console.log(`No user found with email: ${email}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];
            console.log(`User found: ${user.id}, ${user.email}, Role: ${user.role}`);

            // Check password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                console.log(`Invalid password for user: ${user.email}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'default-secret-key',
                { expiresIn: '24h' }
            );

            // Return success response
            console.log(`Login successful for: ${user.email}`);
            return res.status(200).json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Database error during login:', error);
            return res.status(500).json({ error: 'Server error: ' + error.message });
        } finally {
            if (client) client.release();
        }
        
    } catch (error) {
        console.error('Error handling login request:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Also expose the login endpoint as login-direct for compatibility
app.post('/api/auth/login-direct', (req, res) => {
    // Just forward to the login handler
    console.log('Request to /api/auth/login-direct, forwarding to login handler');
    app.handle(req, res);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Something broke!',
        status: 'error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Express login server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- GET  http://localhost:${PORT}/api/auth/test`);
    console.log(`- POST http://localhost:${PORT}/api/auth/login`);
    console.log(`- POST http://localhost:${PORT}/api/auth/login-direct`);
});
