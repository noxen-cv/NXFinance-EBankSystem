const pool = require('../config/database');

class Customer {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM customers WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding customer by ID:', error);
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
                'SELECT * FROM customers WHERE user_id = $1',
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding customer by user ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(customerData) {
        const { 
            user_id, 
            first_name, 
            last_name, 
            date_of_birth = null, 
            address = null, 
            phone_number = null,
            profile_picture = null 
        } = customerData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO customers 
                (user_id, first_name, last_name, date_of_birth, address, phone_number, profile_picture) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *`,
                [user_id, first_name, last_name, date_of_birth, address, phone_number, profile_picture]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async update(id, customerData) {
        const { 
            first_name, 
            last_name, 
            date_of_birth, 
            address, 
            phone_number,
            profile_picture 
        } = customerData;
        
        let client;
        
        try {
            client = await pool.connect();
            
            // Build the update query dynamically based on provided fields
            let updateQuery = 'UPDATE customers SET updated_at = CURRENT_TIMESTAMP';
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
            
            if (date_of_birth !== undefined) {
                params.push(date_of_birth);
                values.push(`date_of_birth = $${params.length}`);
            }
            
            if (address !== undefined) {
                params.push(address);
                values.push(`address = $${params.length}`);
            }
            
            if (phone_number !== undefined) {
                params.push(phone_number);
                values.push(`phone_number = $${params.length}`);
            }
            
            if (profile_picture !== undefined) {
                params.push(profile_picture);
                values.push(`profile_picture = $${params.length}`);
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
            console.error('Error updating customer:', error);
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
                    c.*,
                    u.username,
                    u.email,
                    u.role
                FROM 
                    customers c
                JOIN 
                    users u ON c.user_id = u.id
                WHERE 
                    u.id = $1`,
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting full customer profile:', error);
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
            await client.query('DELETE FROM customers WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
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
                    c.*,
                    u.username,
                    u.email
                FROM 
                    customers c
                JOIN 
                    users u ON c.user_id = u.id
                ORDER BY 
                    c.created_at DESC
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all customers:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async count() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query('SELECT COUNT(*) as count FROM customers');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting customers:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findAll(limit = 10, offset = 0) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT c.*, u.email 
                FROM customers c
                JOIN users u ON c.user_id = u.id
                ORDER BY c.id
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all customers:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = Customer;
