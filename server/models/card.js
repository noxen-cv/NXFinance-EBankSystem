const pool = require('../config/database');

class Card {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT c.*, ct.name as card_type_name, ct.credit_limit, ct.interest_rate 
                FROM cards c
                JOIN card_types ct ON c.card_type_id = ct.id
                WHERE c.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding card by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByCustomerId(customerId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT c.*, ct.name as card_type_name, ct.credit_limit, ct.interest_rate, ct.annual_fee, ct.benefits 
                FROM cards c
                JOIN card_types ct ON c.card_type_id = ct.id
                WHERE c.customer_id = $1
                ORDER BY c.created_at DESC`,
                [customerId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding cards by customer ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByCardNumber(cardNumber) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT c.*, ct.name as card_type_name, ct.credit_limit, ct.interest_rate 
                FROM cards c
                JOIN card_types ct ON c.card_type_id = ct.id
                WHERE c.card_number = $1`,
                [cardNumber]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding card by card number:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(cardData) {
        const { 
            customer_id, 
            card_type_id, 
            card_number, 
            expiry_date, 
            cvv,
            is_active = true
        } = cardData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO cards 
                (customer_id, card_type_id, card_number, expiry_date, cvv, is_active) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`,
                [customer_id, card_type_id, card_number, expiry_date, cvv, is_active]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating card:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async activate(id) {
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                'UPDATE cards SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
                [id]
            );
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error activating card:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async deactivate(id) {
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                'UPDATE cards SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
                [id]
            );
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deactivating card:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getAllCardTypes() {
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

    static async getCardWithMaskedInfo(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    c.id, 
                    c.customer_id, 
                    c.card_type_id,
                    c.is_active,
                    c.expiry_date,
                    CONCAT('XXXX XXXX XXXX ', RIGHT(c.card_number, 4)) as masked_card_number,
                    ct.name as card_type_name,
                    ct.credit_limit,
                    ct.interest_rate,
                    ct.annual_fee,
                    ct.benefits,
                    c.created_at,
                    c.updated_at
                FROM cards c
                JOIN card_types ct ON c.card_type_id = ct.id
                WHERE c.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting masked card info:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getCustomerCardsWithMaskedInfo(customerId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    c.id, 
                    c.customer_id, 
                    c.card_type_id,
                    c.is_active,
                    c.expiry_date,
                    CONCAT('XXXX XXXX XXXX ', RIGHT(c.card_number, 4)) as masked_card_number,
                    ct.name as card_type_name,
                    ct.credit_limit,
                    ct.interest_rate,
                    ct.annual_fee,
                    ct.benefits,
                    c.created_at,
                    c.updated_at
                FROM cards c
                JOIN card_types ct ON c.card_type_id = ct.id
                WHERE c.customer_id = $1
                ORDER BY c.created_at DESC`,
                [customerId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting customer cards with masked info:', error);
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
            const result = await client.query('SELECT COUNT(*) as count FROM cards');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting cards:', error);
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
                `SELECT cards.*, customers.first_name, customers.last_name, card_types.name as card_type_name 
                FROM cards
                JOIN customers ON cards.customer_id = customers.id
                JOIN card_types ON cards.card_type_id = card_types.id
                ORDER BY cards.id
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all cards:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = Card;
