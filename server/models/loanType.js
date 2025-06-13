const pool = require('../config/database');

class LoanType {
    static async findAll() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM loan_types ORDER BY id'
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding loan types:', error);
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
            const result = await client.query(
                'SELECT * FROM loan_types WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding loan type by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(loanTypeData) {
        const {
            name,
            description = null,
            interest_rate,
            min_amount,
            max_amount,
            min_term,
            max_term
        } = loanTypeData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO loan_types 
                (name, description, interest_rate, min_amount, max_amount, min_term, max_term) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *`,
                [name, description, interest_rate, min_amount, max_amount, min_term, max_term]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating loan type:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async update(id, loanTypeData) {
        const {
            name,
            description,
            interest_rate,
            min_amount,
            max_amount,
            min_term,
            max_term
        } = loanTypeData;
        
        let client;
        
        try {
            client = await pool.connect();
            
            // Build the update query dynamically based on provided fields
            let updateQuery = 'UPDATE loan_types SET updated_at = CURRENT_TIMESTAMP';
            const values = [];
            const params = [];
            
            if (name !== undefined) {
                params.push(name);
                values.push(`name = $${params.length}`);
            }
            
            if (description !== undefined) {
                params.push(description);
                values.push(`description = $${params.length}`);
            }
            
            if (interest_rate !== undefined) {
                params.push(interest_rate);
                values.push(`interest_rate = $${params.length}`);
            }
            
            if (min_amount !== undefined) {
                params.push(min_amount);
                values.push(`min_amount = $${params.length}`);
            }
            
            if (max_amount !== undefined) {
                params.push(max_amount);
                values.push(`max_amount = $${params.length}`);
            }
            
            if (min_term !== undefined) {
                params.push(min_term);
                values.push(`min_term = $${params.length}`);
            }
            
            if (max_term !== undefined) {
                params.push(max_term);
                values.push(`max_term = $${params.length}`);
            }
            
            // If no fields to update, return the current loan type
            if (values.length === 0) {
                return this.findById(id);
            }
            
            // Finalize the update query
            params.push(id);
            updateQuery += `, ${values.join(', ')} WHERE id = $${params.length} RETURNING *`;
            
            // Execute the update query
            const result = await client.query(updateQuery, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating loan type:', error);
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
            const result = await client.query(
                'DELETE FROM loan_types WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting loan type:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = LoanType;
