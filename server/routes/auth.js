const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    try {
        if (!req.body || !req.body.username || !req.body.password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const { username, password } = req.body;
        // Check for admin credentials first
        if (username === "admin" && password === "admin") {
            const token = jwt.sign(
                { id: 1, username: "admin", role: "admin" },
                process.env.JWT_SECRET || "nxfinance-secret-key-2025",
                { expiresIn: "24h" }
            );
            return res.status(200).json({ 
                token, 
                user: { id: 1, username: "admin", role: "admin" } 
            });
        }

        // Check database for other users
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user already exists
        const checkUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );

        res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected route example
router.get('/profile', async (req, res) => {
    res.json({ message: 'Protected route' });
});

module.exports = router;
