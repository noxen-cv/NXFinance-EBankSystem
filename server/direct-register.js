/**
 * Direct Registration API Handler
 * This file implements a standalone registration endpoint as a fallback
 * for when the main router-based endpoint encounters issues.
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/database');

/**
 * Handle user registration directly
 */
async function handleRegistration(req, res) {
    console.log('Direct registration handler called');
    
    // Check for required fields
    const { username, password, email, first_name, last_name, phone_number } = req.body;
    
    if (!username || !password || !email || !first_name || !last_name) {
        console.log('Missing required fields in direct registration handler');
        return res.status(400).json({ 
            error: 'Missing required fields',
            received: {
                username: !!username,
                password: !!password,
                email: !!email,
                first_name: !!first_name,
                last_name: !!last_name
            }
        });
    }
    
    let client;
    
    try {
        client = await pool.connect();
        
        // Start a transaction
        await client.query('BEGIN');
        
        // Check for existing username
        const usernameCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        if (usernameCheck.rowCount > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        // Check for existing email
        const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rowCount > 0) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const userResult = await client.query(
            'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, hashedPassword, email, 'customer']
        );
        
        const user = userResult.rows[0];
        console.log('User created in direct handler:', user.id);
        
        // Insert customer
        const customerResult = await client.query(
            'INSERT INTO customers (user_id, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4) RETURNING *',
            [user.id, first_name, last_name, phone_number || null]
        );
        
        const customer = customerResult.rows[0];
        console.log('Customer created in direct handler:', customer.id);
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        // Rollback transaction on error
        if (client) {
            await client.query('ROLLBACK');
        }
        
        console.error('Direct registration error:', error);
        
        // Send appropriate error response
        if (error.code === '23505') {
            // Unique constraint violation
            return res.status(409).json({ 
                error: error.detail.includes('username') 
                    ? 'Username already exists' 
                    : 'Email already in use' 
            });
        }
        
        res.status(500).json({ error: 'Server error: ' + error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = { handleRegistration };
