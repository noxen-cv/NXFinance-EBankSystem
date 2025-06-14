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
    
    // Add CORS debug logging
    res.on('finish', () => {
        console.log(`[CORS DEBUG] Response headers for ${req.originalUrl}:`);
        console.log(`  Access-Control-Allow-Origin: ${res.getHeader('Access-Control-Allow-Origin')}`);
        console.log(`  Access-Control-Allow-Credentials: ${res.getHeader('Access-Control-Allow-Credentials')}`);
    });
    
    next();
});

// Configure database migrations
const { runMigrations } = require('./config/migrations');

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow specific origins
        const allowedOrigins = [
            'http://localhost:5500', 
            'http://127.0.0.1:5500', 
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            console.log(`[CORS] Allowing origin: ${origin}`);
            return callback(null, true);
        } else {
            console.log(`[CORS] Blocking origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special CORS handling for registration and login endpoints
app.options('/api/auth/register', cors({ 
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('/api/auth/register-direct', cors({ 
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('/api/auth/login', cors({ 
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('/api/auth/login-direct', cors({ 
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.options('/api/auth/login-direct', cors({ 
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

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

// Direct registration and login handlers (must come before router mounting)
const { handleRegistration } = require('./direct-register');
const { handleLogin } = require('./direct-login');

// Define direct handler routes with explicit CORS handling
app.post('/api/auth/register', cors(), handleRegistration);
app.post('/api/auth/register-direct', cors(), handleRegistration); 
app.post('/api/auth/login', cors(), handleLogin);
app.post('/api/auth/login-direct', cors(), handleLogin);

// Handle OPTIONS preflight requests for these endpoints
app.options('/api/auth/login', cors());
app.options('/api/auth/login-direct', cors());

// Special diagnostic endpoint
app.get('/api/auth/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API connection is working',
        timestamp: new Date().toISOString(),
        server: 'NXFinance API'
    });
});

// API Routes (excluding registration which is handled above)
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

// Serve main public pages
app.use('/', express.static(path.join(__dirname, '../public'), { 
    index: ['index.html', 'login.html'],
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
