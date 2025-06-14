/**
 * Direct Login API Handler
 * This file implements a standalone login endpoint as a fallback
 * for when the main router-based endpoint encounters issues.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./config/database');
require('dotenv').config();

/**
 * Handle user login directly
 */
async function handleLogin(req, res) {
    console.log('[DEBUG] Direct login handler called');
    console.log('[DEBUG] Request headers:', JSON.stringify(req.headers));
    console.log('[DEBUG] Request body:', req.body ? JSON.stringify(req.body) : '(no body)');
    
    // Detailed debugging for empty body
    if (!req.body) {
        console.log('[DEBUG] Request body is undefined/null. Content-Type header:', req.headers['content-type']);
        console.log('[DEBUG] Raw request:', req);
        return res.status(400).json({ 
            error: 'Request body is missing',
            debug: true,
            headers: req.headers
        });
    }
    
    try {
        // Check for required fields
        if (!req.body.email || !req.body.password) {
            console.log('[DEBUG] Missing required fields in direct login handler');
            console.log('[DEBUG] Fields received:', Object.keys(req.body));
            return res.status(400).json({ 
                error: 'Email and password are required',
                debug: true,
                fieldsReceived: Object.keys(req.body)
            });
        }

        const { email, password } = req.body;
          // Find user by email
        let client;
        try {
            console.log('[DEBUG] Attempting to connect to database');
            client = await pool.connect();
            console.log('[DEBUG] Connected to database successfully');
            
            console.log('[DEBUG] Executing query to find user by email:', email);
            const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            
            console.log('[DEBUG] Query complete. Rows returned:', result.rowCount);
            
            // Check if admin role is required and validate
            const isAdminLogin = req.originalUrl.includes('adminlogin');
            const user = result.rows[0];
            
            if (!user) {
                console.log('[DEBUG] No user found for email:', email);
                return res.status(401).json({ 
                    error: 'Invalid credentials',
                    debug: true,
                    message: 'No user found with this email'
                });
            }
            
            console.log('[DEBUG] User found:', user.id, user.email, 'Role:', user.role);
            
            // For admin login page, verify the user has admin role
            if (isAdminLogin && user.role !== 'admin') {
                console.log('[DEBUG] Non-admin user attempting to log in via admin login:', email);
                return res.status(403).json({ 
                    error: 'Access denied',
                    debug: true,
                    message: 'This login is restricted to admin users only'
                });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log('Password mismatch for email:', email);
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('Login successful for user:', user.id, user.email, user.role);

            // Return token and user info
            return res.status(200).json({ 
                token, 
                user: { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role 
                } 
            });
        } catch (error) {
            console.error('Error during direct login:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    } catch (error) {
        console.error('Direct login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
}

module.exports = { handleLogin };
