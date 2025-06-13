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
        if (!req.body || !req.body.username || !req.body.password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const { username, password } = req.body;
        const user = await User.findByCredentials(username, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
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
        const { username, password, email, first_name, last_name, date_of_birth, phone_number, address } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create user
        const user = await User.create({
            username,
            password,
            email,
            role: 'customer'
        });

        // Create customer profile
        const customer = await Customer.create({
            user_id: user.id,
            first_name,
            last_name,
            date_of_birth: date_of_birth || null,
            address: address || null,
            phone_number: phone_number || null
        });

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
