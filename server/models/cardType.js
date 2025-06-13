const pool = require('../config/database');

class CardType {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM card_types WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding card type by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByName(name) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM card_types WHERE name = $1',
                [name]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding card type by name:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getAll() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM card_types ORDER BY name ASC'
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all card types:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findAll() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query('SELECT * FROM card_types ORDER BY id');
            return result.rows;
        } catch (error) {
            console.error('Error finding all card types:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(cardTypeData) {
        const { 
            name, 
            description, 
            credit_limit, 
            interest_rate, 
            annual_fee,
            benefits
        } = cardTypeData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO card_types 
                (name, description, credit_limit, interest_rate, annual_fee, benefits) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`,
                [name, description, credit_limit, interest_rate, annual_fee, benefits]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating card type:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async update(id, cardTypeData) {
        const { 
            name, 
            description, 
            credit_limit, 
            interest_rate, 
            annual_fee,
            benefits
        } = cardTypeData;
        
        let client;
        
        try {
            client = await pool.connect();
            
            // Build the update query dynamically based on provided fields
            let updateQuery = 'UPDATE card_types SET updated_at = CURRENT_TIMESTAMP';
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
            
            if (credit_limit !== undefined) {
                params.push(credit_limit);
                values.push(`credit_limit = $${params.length}`);
            }
            
            if (interest_rate !== undefined) {
                params.push(interest_rate);
                values.push(`interest_rate = $${params.length}`);
            }
            
            if (annual_fee !== undefined) {
                params.push(annual_fee);
                values.push(`annual_fee = $${params.length}`);
            }
            
            if (benefits !== undefined) {
                params.push(benefits);
                values.push(`benefits = $${params.length}`);
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
            console.error('Error updating card type:', error);
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
            
            // Check if there are any cards using this card type
            const cardsResult = await client.query(
                'SELECT COUNT(*) FROM cards WHERE card_type_id = $1',
                [id]
            );
            
            if (parseInt(cardsResult.rows[0].count) > 0) {
                throw new Error('Cannot delete card type that is in use');
            }
            
            await client.query('DELETE FROM card_types WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting card type:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = CardType;
