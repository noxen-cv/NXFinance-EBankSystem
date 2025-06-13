const pool = require('../config/database');

class Account {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM accounts WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding account by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByAccountNumber(accountNumber) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM accounts WHERE account_number = $1',
                [accountNumber]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding account by account number:', error);
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
                'SELECT * FROM accounts WHERE customer_id = $1 ORDER BY created_at DESC',
                [customerId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding accounts by customer ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(accountData) {
        const { 
            customer_id, 
            account_number, 
            account_type, 
            balance = 0, 
            is_active = true
        } = accountData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO accounts 
                (customer_id, account_number, account_type, balance, is_active) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *`,
                [customer_id, account_number, account_type, balance, is_active]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating account:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async updateBalance(id, amount) {
        let client;
        
        try {
            client = await pool.connect();
            await client.query('BEGIN');
            
            // Get current balance
            const accountResult = await client.query(
                'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',
                [id]
            );
            
            if (accountResult.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Account not found');
            }
            
            const newBalance = parseFloat(accountResult.rows[0].balance) + parseFloat(amount);
            
            // Update balance
            const result = await client.query(
                'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [newBalance, id]
            );
            
            await client.query('COMMIT');
            
            return result.rows[0];
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Error updating account balance:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async transfer(fromAccountId, toAccountId, amount, description) {
        let client;
        
        try {
            client = await pool.connect();
            await client.query('BEGIN');
            
            // Generate reference number for the transaction
            const referenceNumber = `TRF${Date.now()}${Math.floor(Math.random() * 1000)}`;
            
            // Subtract from source account
            const fromAccount = await this.updateBalanceTransaction(client, fromAccountId, -amount);
            
            // Add to destination account
            const toAccount = await this.updateBalanceTransaction(client, toAccountId, amount);
            
            // Record transaction for source account
            await client.query(
                `INSERT INTO transactions 
                (account_id, transaction_type, amount, description, reference_number, status) 
                VALUES ($1, 'transfer_out', $2, $3, $4, 'completed')`,
                [fromAccountId, amount, description, referenceNumber]
            );
            
            // Record transaction for destination account
            await client.query(
                `INSERT INTO transactions 
                (account_id, transaction_type, amount, description, reference_number, status) 
                VALUES ($1, 'transfer_in', $2, $3, $4, 'completed')`,
                [toAccountId, amount, description, referenceNumber]
            );
            
            await client.query('COMMIT');
            
            return {
                fromAccount,
                toAccount,
                amount,
                reference: referenceNumber
            };
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Error transferring funds:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async updateBalanceTransaction(client, accountId, amount) {
        // Get current balance
        const accountResult = await client.query(
            'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
            [accountId]
        );
        
        if (accountResult.rows.length === 0) {
            throw new Error(`Account with ID ${accountId} not found`);
        }
        
        const account = accountResult.rows[0];
        const newBalance = parseFloat(account.balance) + parseFloat(amount);
        
        // Make sure balance doesn't go negative
        if (newBalance < 0) {
            throw new Error('Insufficient funds');
        }
        
        // Update balance
        const result = await client.query(
            'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [newBalance, accountId]
        );
        
        return result.rows[0];
    }

    static async setActiveStatus(id, isActive) {
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                'UPDATE accounts SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [isActive, id]
            );
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating account status:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getAllForAdmin(limit = 100, offset = 0) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    a.*,
                    c.first_name,
                    c.last_name,
                    u.username,
                    u.email
                FROM 
                    accounts a
                JOIN 
                    customers c ON a.customer_id = c.id
                JOIN 
                    users u ON c.user_id = u.id
                ORDER BY 
                    a.created_at DESC
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all accounts:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getCustomerAccountsWithTransactions(customerId) {
        let client;
        try {
            client = await pool.connect();
            
            // Get accounts
            const accounts = await this.findByCustomerId(customerId);
            
            // For each account, get the 5 most recent transactions
            for (const account of accounts) {
                const transactionResult = await client.query(
                    `SELECT * FROM transactions 
                    WHERE account_id = $1 
                    ORDER BY transaction_date DESC 
                    LIMIT 5`,
                    [account.id]
                );
                
                account.recent_transactions = transactionResult.rows;
            }
            
            return accounts;
        } catch (error) {
            console.error('Error getting customer accounts with transactions:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getTotalBalance(customerId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT SUM(balance) as total_balance FROM accounts WHERE customer_id = $1 AND is_active = true',
                [customerId]
            );
            return result.rows[0].total_balance || 0;
        } catch (error) {
            console.error('Error getting total balance:', error);
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
            const result = await client.query('SELECT COUNT(*) as count FROM accounts');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting accounts:', error);
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
                `SELECT a.*, c.first_name, c.last_name 
                FROM accounts a
                JOIN customers c ON a.customer_id = c.id
                ORDER BY a.id
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all accounts:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    
    static async updateBalance(accountId, amount, client = null) {
        let ownClient = false;
        try {
            if (!client) {
                ownClient = true;
                client = await pool.connect();
            }
            
            // Get current balance
            const accountResult = await client.query(
                'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
                [accountId]
            );
            
            if (accountResult.rows.length === 0) {
                throw new Error('Account not found');
            }
            
            const account = accountResult.rows[0];
            const newBalance = parseFloat(account.balance) + parseFloat(amount);
            
            if (newBalance < 0) {
                throw new Error('Insufficient balance');
            }
            
            // Update balance
            const updateResult = await client.query(
                `UPDATE accounts 
                SET balance = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING *`,
                [newBalance.toFixed(2), accountId]
            );
            
            return updateResult.rows[0];
        } catch (error) {
            console.error('Error updating account balance:', error);
            throw error;
        } finally {
            if (ownClient && client) {
                client.release();
            }
        }
    }
}

module.exports = Account;
