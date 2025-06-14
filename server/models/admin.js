const pool = require('../config/database');

class Admin {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM admins WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding admin by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByUserId(userId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM admins WHERE user_id = $1',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding admin by user ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }    static async create(adminData) {
        const { 
            user_id, 
            email,
            first_name, 
            last_name, 
            department = null, 
            access_level = 'standard'
        } = adminData;
        
        let client;
        
        try {
            client = await pool.connect();
            
            // If email isn't provided, fetch it from users table
            let adminEmail = email;
            if (!adminEmail) {
                const userResult = await client.query('SELECT email FROM users WHERE id = $1', [user_id]);
                if (userResult.rows.length > 0) {
                    adminEmail = userResult.rows[0].email;
                }
            }
            
            const result = await client.query(
                `INSERT INTO admins 
                (user_id, email, first_name, last_name, department, access_level) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`,
                [user_id, adminEmail, first_name, last_name, department, access_level]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating admin:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async update(id, adminData) {
        const { 
            first_name, 
            last_name, 
            department, 
            access_level 
        } = adminData;
        
        let client;
        
        try {
            client = await pool.connect();
            
            // Build the update query dynamically based on provided fields
            let updateQuery = 'UPDATE admins SET updated_at = CURRENT_TIMESTAMP';
            const values = [];
            const params = [];
            
            if (first_name !== undefined) {
                params.push(first_name);
                values.push(`first_name = $${params.length}`);
            }
            
            if (last_name !== undefined) {
                params.push(last_name);
                values.push(`last_name = $${params.length}`);
            }
            
            if (department !== undefined) {
                params.push(department);
                values.push(`department = $${params.length}`);
            }
            
            if (access_level !== undefined) {
                params.push(access_level);
                values.push(`access_level = $${params.length}`);
            }
            
            if (values.length === 0) {
                // Nothing to update
                return await this.findById(id);
            }
            
            updateQuery += `, ${values.join(', ')}`;
            params.push(id);
            updateQuery += ` WHERE id = $${params.length} RETURNING *`;
            
            const result = await client.query(updateQuery, params);
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating admin:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getFullProfile(userId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    a.*,
                    u.username,
                    u.email,
                    u.role
                FROM 
                    admins a
                JOIN 
                    users u ON a.user_id = u.id
                WHERE 
                    u.id = $1`,
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting full admin profile:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async delete(id) {
        let client;
        try {
            client = await pool.connect();
            await client.query('DELETE FROM admins WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting admin:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getAll(limit = 100, offset = 0) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    a.*,
                    u.username,
                    u.email
                FROM 
                    admins a
                JOIN 
                    users u ON a.user_id = u.id
                ORDER BY 
                    a.created_at DESC
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all admins:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = Admin;
