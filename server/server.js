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

// Middleware
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special CORS handling for registration endpoint
app.options('/api/auth/register', cors({ 
    origin: true,
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// Direct registration handlers (must come before router mounting)
const { handleRegistration } = require('./direct-register');
app.post('/api/auth/register', handleRegistration);
app.post('/api/auth/register-direct', handleRegistration);

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
        '/api/auth/login': ['POST', 'OPTIONS']
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
app.use('/api/*', (req, res, next) => {
    console.log(`Unmatched API route: ${req.method} ${req.originalUrl}`);
    
    // If this is a registration attempt
    if (req.originalUrl.includes('/api/auth/register')) {
        console.log('Registration attempt failed to match a route');
        
        // If this is an OPTIONS request, handle it specially
        if (req.method === 'OPTIONS') {
            return res.status(204).header('Access-Control-Allow-Methods', 'POST').end();
        }
        
        // For all other methods to registration endpoint
        return res.status(405).json({
            error: 'Method not allowed for registrapp.get(ation. Use POST only.',
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
    console.error('Server error:', err);
    
    // Ensure we always return a properly formatted JSON response
    res.status(err.status || 500).json({ 
        error: err.message || 'Something broke!',
        status: 'error',
        timestamp: new Date().toISOString()
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
