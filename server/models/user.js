const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static createTable = async () => {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        try {
            await pool.query(createTableQuery);
            // Insert default admin user if not exists
            const hashedPassword = await bcrypt.hash('admin', 10);
            const insertAdminQuery = `
                INSERT INTO users (username, password)
                VALUES ('admin', $1)
                ON CONFLICT (username) DO NOTHING
            `;
            await pool.query(insertAdminQuery, [hashedPassword]);
        } catch (error) {
            console.error('Error creating users table:', error);
            throw error;
        }
    }

    static async findByCredentials(username, password) {
        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = result.rows[0];
            
            if (!user) {
                return null;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return null;
            }

            return user;
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    }
}

module.exports = User;
