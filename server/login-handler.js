/**
 * Standalone login handler for NXFinance API
 * This is a simplified and focused login handler with built-in CORS handling
 * to bypass any issues with Express routing.
 */
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./config/database');
require('dotenv').config();

const PORT = 3000;

// Create HTTP server
const server = http.createServer(async (req, res) => {    // Enable CORS for all routes with specific origins for credentials
    const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Log origins for debugging
    console.log(`Request from origin: ${req.headers.origin || 'unknown'}, URL: ${req.url}`);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse URL
    const url = req.url;
    console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);

    // Handle API test endpoint
    if (url === '/api/auth/test' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'API connection is working',
            timestamp: new Date().toISOString(),
            server: 'NXFinance Standalone API'
        }));
        return;
    }

    // Handle login endpoints
    if ((url === '/api/auth/login' || url === '/api/auth/login-direct') && req.method === 'POST') {
        // Parse request body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                // Parse JSON body
                const data = JSON.parse(body);
                console.log('Login request with data:', JSON.stringify({
                    email: data.email,
                    password: data.password ? '[REDACTED]' : undefined
                }));

                // Validate required fields
                if (!data.email || !data.password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: 'Email and password are required',
                        fieldsReceived: Object.keys(data)
                    }));
                    return;
                }

                // Find user by email
                let client;
                try {
                    client = await pool.connect();
                    const result = await client.query('SELECT * FROM users WHERE email = $1', [data.email]);
                    
                    if (result.rows.length === 0) {
                        console.log('No user found with email:', data.email);
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid credentials' }));
                        return;
                    }

                    const user = result.rows[0];
                    console.log('User found:', user.id, user.email, 'Role:', user.role);

                    // Check password
                    const isValid = await bcrypt.compare(data.password, user.password);
                    if (!isValid) {
                        console.log('Invalid password for user:', user.email);
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid credentials' }));
                        return;
                    }

                    // Create JWT token
                    const token = jwt.sign(
                        { id: user.id, username: user.username, role: user.role },
                        process.env.JWT_SECRET || 'default-secret-key',
                        { expiresIn: '24h' }
                    );
                    
                    // Return success response
                    console.log('Login successful for:', user.email);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        token,
                        user: {
                            id: user.id,
                            username: user.username,
                            role: user.role
                        }
                    }));
                    
                } catch (error) {
                    console.error('Database error during login:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Server error: ' + error.message }));
                } finally {
                    if (client) client.release();
                }
                
            } catch (error) {
                console.error('Error parsing request:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request format' }));
            }
        });
        return;
    }

    // Handle 404 for all other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, () => {
    console.log(`Standalone login server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- GET  http://localhost:${PORT}/api/auth/test`);
    console.log(`- POST http://localhost:${PORT}/api/auth/login`);
    console.log(`- POST http://localhost:${PORT}/api/auth/login-direct`);
});
