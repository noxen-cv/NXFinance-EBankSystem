const pool = require('../config/database');

class Transaction {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM transactions WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding transaction by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByAccountId(accountId, limit = 20, offset = 0) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT * FROM transactions 
                WHERE account_id = $1 
                ORDER BY transaction_date DESC 
                LIMIT $2 OFFSET $3`,
                [accountId, limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding transactions by account ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByReferenceNumber(referenceNumber) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM transactions WHERE reference_number = $1',
                [referenceNumber]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding transactions by reference number:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(transactionData) {
        const { 
            account_id, 
            transaction_type, 
            amount, 
            description = null, 
            reference_number = null,
            status = 'completed',
            transaction_date = new Date()
        } = transactionData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO transactions 
                (account_id, transaction_type, amount, description, reference_number, status, transaction_date) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *`,
                [account_id, transaction_type, amount, description, reference_number, status, transaction_date]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async updateStatus(id, status) {
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                'UPDATE transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [status, id]
            );
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating transaction status:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getCustomerTransactions(customerId, limit = 50, offset = 0) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT t.*, a.account_number, a.account_type  
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE a.customer_id = $1
                ORDER BY t.transaction_date DESC
                LIMIT $2 OFFSET $3`,
                [customerId, limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting customer transactions:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async countByDateRange(startDate, endDate) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN transaction_type = 'deposit' THEN 1 ELSE 0 END) as deposit_count,
                    SUM(CASE WHEN transaction_type = 'withdrawal' THEN 1 ELSE 0 END) as withdrawal_count,
                    SUM(CASE WHEN transaction_type = 'transfer_in' OR transaction_type = 'transfer_out' THEN 1 ELSE 0 END) as transfer_count,
                    SUM(CASE WHEN transaction_type = 'payment' THEN 1 ELSE 0 END) as payment_count
                FROM 
                    transactions
                WHERE 
                    transaction_date BETWEEN $1 AND $2`,
                [startDate, endDate]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error counting transactions by date range:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getMonthlyTransactionSummary(customerId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    date_trunc('month', transaction_date) as month,
                    SUM(CASE WHEN transaction_type = 'deposit' OR transaction_type = 'transfer_in' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN transaction_type = 'withdrawal' OR transaction_type = 'transfer_out' OR transaction_type = 'payment' THEN amount ELSE 0 END) as expense
                FROM 
                    transactions t
                JOIN 
                    accounts a ON t.account_id = a.id
                WHERE 
                    a.customer_id = $1 AND
                    transaction_date >= date_trunc('month', NOW() - INTERVAL '6 months')
                GROUP BY 
                    date_trunc('month', transaction_date)
                ORDER BY 
                    month ASC`,
                [customerId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting monthly transaction summary:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getRecentActivity() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    t.*,
                    a.account_number,
                    c.first_name,
                    c.last_name
                FROM 
                    transactions t
                JOIN 
                    accounts a ON t.account_id = a.id
                JOIN 
                    customers c ON a.customer_id = c.id
                ORDER BY 
                    t.transaction_date DESC
                LIMIT 10`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByAccountIds(accountIds, limit = 20, offset = 0, startDate = null, endDate = null) {
        if (!accountIds || accountIds.length === 0) {
            return [];
        }
        
        let client;
        try {
            client = await pool.connect();
            
            let query = `SELECT * FROM transactions WHERE account_id = ANY($1::int[])`;
            const params = [accountIds];
            
            if (startDate) {
                query += ` AND transaction_date >= $${params.length + 1}`;
                params.push(startDate);
            }
            
            if (endDate) {
                query += ` AND transaction_date <= $${params.length + 1}`;
                params.push(endDate);
            }
            
            query += ` ORDER BY transaction_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);
            
            const result = await client.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error finding transactions by account IDs:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    
    static async countByAccountIds(accountIds, startDate = null, endDate = null) {
        if (!accountIds || accountIds.length === 0) {
            return 0;
        }
        
        let client;
        try {
            client = await pool.connect();
            
            let query = `SELECT COUNT(*) as count FROM transactions WHERE account_id = ANY($1::int[])`;
            const params = [accountIds];
            
            if (startDate) {
                query += ` AND transaction_date >= $${params.length + 1}`;
                params.push(startDate);
            }
            
            if (endDate) {
                query += ` AND transaction_date <= $${params.length + 1}`;
                params.push(endDate);
            }
            
            const result = await client.query(query, params);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting transactions by account IDs:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    
    static async findRecent(limit = 10) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT * FROM transactions 
                ORDER BY transaction_date DESC 
                LIMIT $1`,
                [limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding recent transactions:', error);
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
            const result = await client.query('SELECT COUNT(*) as count FROM transactions');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting transactions:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    
    static async findAll(limit = 20, offset = 0) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT * FROM transactions 
                ORDER BY transaction_date DESC 
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all transactions:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = Transaction;
