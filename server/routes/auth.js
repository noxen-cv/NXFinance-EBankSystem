const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Customer = require('../models/customer');
const pool = require('../config/database');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('[DEBUG] Login route called');
        console.log('[DEBUG] Request headers:', JSON.stringify(req.headers));
        console.log('[DEBUG] Request body:', req.body ? JSON.stringify(req.body) : '(no body)');
        
        if (!req.body) {
            console.log('[DEBUG] Request body is missing. Content-Type:', req.headers['content-type']);
            return res.status(400).json({ 
                error: 'Request body is missing',
                debug: true,
                headers: req.headers 
            });
        }
        
        if (!req.body.email || !req.body.password) {
            console.log('[DEBUG] Missing required login fields');
            return res.status(400).json({ 
                error: 'Email and password are required',
                fieldsReceived: Object.keys(req.body)
            });
        }

        const { email, password } = req.body;
        console.log('[DEBUG] Attempting to authenticate user with email:', email);
        
        // Check if this is an admin login
        const isAdminLogin = req.headers.referer && req.headers.referer.includes('adminlogin');
        console.log('[DEBUG] Is admin login attempt:', isAdminLogin);
        
        const user = await User.findByEmailAndPassword(email, password);
        
        if (!user) {
            console.log('[DEBUG] Authentication failed: invalid credentials for email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('[DEBUG] User authenticated successfully:', user.id, user.email, 'Role:', user.role);
        
        // For admin login, verify the user has admin role
        if (isAdminLogin && user.role !== 'admin') {
            console.log('[DEBUG] Non-admin user attempting to use admin login:', email);
            return res.status(403).json({ 
                error: 'Access denied. Admin privileges required.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        
        const { username, password, email, first_name, last_name, date_of_birth, phone_number, address } = req.body;
        
        // Validate required fields with detailed logging
        if (!username || !password || !email || !first_name || !last_name) {
            console.log('Missing required fields');
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
        
        // Check if user already exists (by username)
        try {
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                console.log('Username already exists:', username);
                return res.status(400).json({ error: 'Username already exists' });
            }
        } catch (error) {
            console.error('Error checking username:', error);
            return res.status(500).json({ error: 'Error checking username: ' + error.message });
        }
        
        // Check if email already exists
        try {
            const emailExists = await User.findByEmail(email);
            if (emailExists) {
                console.log('Email already in use:', email);
                return res.status(400).json({ error: 'Email already in use' });
            }
        } catch (error) {
            console.error('Error checking email:', error);
            return res.status(500).json({ error: 'Error checking email: ' + error.message });
        }

        // Create user
        let user;
        try {
            user = await User.create({
                username,
                password,
                email,
                role: 'customer'
            });
            console.log('User created successfully:', user.id);
        } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ error: 'Error creating user: ' + error.message });
        }

        // Create customer profile
        try {
            const customer = await Customer.create({
                user_id: user.id,
                first_name,
                last_name,
                date_of_birth: date_of_birth || null,
                address: address || null,
                phone_number: phone_number || null
            });
            console.log('Customer profile created successfully:', customer.id);
        } catch (error) {
            console.error('Error creating customer profile:', error);
            // Try to clean up the created user to avoid orphaned records
            try {
                await User.deleteUser(user.id);
                console.log('Cleaned up user after customer creation failure:', user.id);
            } catch (cleanupError) {
                console.error('Failed to clean up user after customer creation error:', cleanupError);
            }
            return res.status(500).json({ error: 'Error creating customer profile: ' + error.message });
        }

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
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Protected route example
router.get('/profile', async (req, res) => {
    res.json({ message: 'Protected route' });
});

module.exports = router;
