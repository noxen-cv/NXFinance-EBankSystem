const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Verify environment variables are loaded
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('Database configuration missing. Check your .env file.');
    process.exit(1);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Add retry logic
    retryDelay: 2000, // Time to wait between retries in ms
    maxRetries: 5 // Maximum number of retries
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database');
        console.log('Database connection config:', {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        client.release();
        return true;
    } catch (err) {
        console.error('Database connection error:', {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        return false;
    }
};

testConnection();

module.exports = pool;
