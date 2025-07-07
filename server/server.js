const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');
const transactionRoutes = require('./routes/transaction');
const cardRoutes = require('./routes/card');
const loanRoutes = require('./routes/loan');

// Debug route handling
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Only log body for POST/PUT requests to avoid excessive logging
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request body:', req.body ? JSON.stringify(req.body) : '(no body)');
    }
    
    next();
});

// Configure database migrations
const { runMigrations } = require('./config/migrations');

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        console.log('[CORS] Request origin:', origin);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('[CORS] No origin header, allowing request');
            return callback(null, true);
        }
        
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5500',
            'http://localhost:5501',
            'http://127.0.0.1:5501'
        ];
        
        if (allowedOrigins.includes(origin)) {
            console.log('[CORS] Origin allowed from explicit list:', origin);
            return callback(null, true);
        }
        
        // For development, allow any localhost/127.0.0.1 origin
        if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/)) {
            console.log('[CORS] Origin allowed from regex match:', origin);
            return callback(null, true);
        }
        
        console.log('[CORS] Origin NOT allowed:', origin);
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom CORS fix middleware to override any wildcard headers
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Only apply for requests with credentials
    if (origin && req.headers['access-control-request-method'] !== undefined || 
        (req.method !== 'OPTIONS' && req.headers.origin)) {
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5500',
            'http://localhost:5501',
            'http://127.0.0.1:5501'
        ];
        
        if (allowedOrigins.includes(origin) || (origin && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/))) {
            console.log('[CUSTOM-CORS] Overriding CORS headers for origin:', origin);
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', 'true');
        }
    }
    
    next();
});

// Additional OPTIONS handling for preflight requests
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    console.log('[OPTIONS] Preflight request from origin:', origin);
    
    // List of allowed origins (same as in main CORS config)
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501'
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || (origin && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/))) {
        console.log('[OPTIONS] Setting Access-Control-Allow-Origin to:', origin);
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        console.log('[OPTIONS] Origin not allowed, not setting CORS header');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Body parser middleware for form data

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Error handling for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
});

// Initialize database and start server
const initializeDatabase = async () => {
    try {
        await runMigrations();
        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/loans', loanRoutes);

// Special 405 Method Not Allowed handler
app.use((req, res, next) => {
    const allowedMethods = {
        '/api/auth/register': ['POST', 'OPTIONS'],
        '/api/auth/register-direct': ['POST', 'OPTIONS'],
        '/api/auth/login': ['POST', 'OPTIONS'],
        '/api/auth/login-direct': ['POST', 'OPTIONS']
    };
    
    const path = req.path;
    
    if (path in allowedMethods && !allowedMethods[path].includes(req.method)) {
        console.log(`405 handler: ${req.method} not allowed for ${path}`);
        return res.status(405)
            .set('Allow', allowedMethods[path].join(', '))
            .json({
                error: `Method ${req.method} not allowed for ${path}`,
                allowedMethods: allowedMethods[path]
            });
    }
    
    next();
});

// This section has been moved to the API Routes section above

// Add a 404 handler that creates a better error message
app.use('/api', (req, res, next) => {
    console.log(`API route handler: ${req.method} ${req.originalUrl}`);
    
    // If this is a registration attempt
    if (req.originalUrl.includes('/api/auth/register')) {
        console.log('Registration attempt handled by catch-all handler');
        
        // If this is an OPTIONS request, handle it specially
        if (req.method === 'OPTIONS') {
            return res.status(204).header('Access-Control-Allow-Methods', 'POST').end();
        }
        
        // For all other methods to registration endpoint
        return res.status(405).json({
            error: 'Method not allowed for registration. Use POST only.',
            debug: true,
            requestMethod: req.method,
            allowedMethods: ['POST'],
            alternateEndpoint: '/api/auth/register-direct'
        });
    }
    
    next();
});

// Serve public assets (images, css, js) without restriction
app.use('/Assets', express.static(path.join(__dirname, '../public/Assets')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));

// Serve src folder for CSS and JS components
app.use('/src', express.static(path.join(__dirname, '../src')));

// Serve public folder for HTML pages and assets
app.use('/public', express.static(path.join(__dirname, '../public')));

// Serve root directory (for index.html in root)
app.use('/', express.static(path.join(__dirname, '../'), { 
    index: ['index.html'],
    extensions: ['html', 'htm']
}));

// Fallback to serve public pages without /public prefix for compatibility
app.use('/', express.static(path.join(__dirname, '../public'), { 
    index: false,
    extensions: ['html', 'htm']
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[DEBUG] Server error:', err);
    console.error('[DEBUG] Error stack:', err.stack);
    
    // Log request details for debugging
    console.error('[DEBUG] Error occurred on request:');
    console.error(`[DEBUG] - URL: ${req.method} ${req.originalUrl}`);
    console.error(`[DEBUG] - IP: ${req.ip}`);
    console.error('[DEBUG] - Headers:', JSON.stringify(req.headers));
    
    if (req.body) {
        console.error('[DEBUG] - Body:', JSON.stringify(req.body, null, 2));
    }
    
    // Determine appropriate error message and status code
    let statusCode = err.status || 500;
    let errorMessage = err.message || 'An unexpected error occurred';
    
    // Create more descriptive errors based on type
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Validation error: ' + err.message;
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorMessage = 'Authentication error: ' + err.message;
    } else if (err.code === 'EBADCSRFTOKEN') {
        statusCode = 403;
        errorMessage = 'CSRF verification failed';
    } else if (err.code === '23505') {
        // PostgreSQL unique violation
        statusCode = 409;
        errorMessage = 'This resource already exists'; 
    }
    
    // Ensure we always return a properly formatted JSON response
    res.status(statusCode).json({ 
        error: errorMessage,
        status: 'error',
        timestamp: new Date().toISOString(),
        debug: process.env.NODE_ENV !== 'production' ? {
            errorName: err.name,
            errorCode: err.code,
            path: req.path,
            method: req.method
        } : undefined
    });
});

const PORT = process.env.PORT || 3000;

// Start server after database initialization
const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
