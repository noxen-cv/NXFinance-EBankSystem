const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async createTable() {
        // This is now handled by migration.js
        return true;
    }

    static async findByCredentials(username, password) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
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
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByUsername(username) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(userData) {
        const { username, password, email, role = 'customer' } = userData;
        let client;
        
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            client = await pool.connect();
            const result = await client.query(
                'INSERT INTO users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
                [username, hashedPassword, email, role]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async updatePassword(id, newPassword) {
        let client;
        
        try {
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            client = await pool.connect();
            const result = await client.query(
                'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [hashedPassword, id]
            );
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async deleteUser(id) {
        let client;
        
        try {
            client = await pool.connect();
            await client.query('DELETE FROM users WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = User;
