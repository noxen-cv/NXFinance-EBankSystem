const pool = require('../config/database');

class Loan {
    static async findById(id) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT l.*, lt.name as loan_type_name, lt.description as loan_type_description
                FROM loans l
                JOIN loan_types lt ON l.loan_type_id = lt.id
                WHERE l.id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding loan by ID:', error);
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
                `SELECT l.*, lt.name as loan_type_name, lt.description as loan_type_description
                FROM loans l
                JOIN loan_types lt ON l.loan_type_id = lt.id
                WHERE l.customer_id = $1
                ORDER BY l.created_at DESC`,
                [customerId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding loans by customer ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(loanData) {
        const { 
            customer_id, 
            loan_type_id, 
            amount, 
            interest_rate, 
            term_months,
            start_date = null,
            end_date = null,
            status = 'pending'
        } = loanData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO loans 
                (customer_id, loan_type_id, amount, interest_rate, term_months, start_date, end_date, status) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *`,
                [customer_id, loan_type_id, amount, interest_rate, term_months, start_date, end_date, status]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating loan:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async updateStatus(id, status, startDate = null, endDate = null) {
        let client;
        
        try {
            client = await pool.connect();
            
            let query = 'UPDATE loans SET status = $1';
            const params = [status];
            
            if (startDate) {
                params.push(startDate);
                query += `, start_date = $${params.length}`;
            }
            
            if (endDate) {
                params.push(endDate);
                query += `, end_date = $${params.length}`;
            }
            
            params.push(id);
            query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`;
            
            const result = await client.query(query, params);
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating loan status:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async approveLoan(id) {
        let client;
        
        try {
            client = await pool.connect();
            await client.query('BEGIN');
            
            // Get the loan details
            const loanResult = await client.query(
                'SELECT * FROM loans WHERE id = $1',
                [id]
            );
            
            if (loanResult.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Loan not found');
            }
            
            const loan = loanResult.rows[0];
            
            // Calculate start and end dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + parseInt(loan.term_months));
            
            // Update loan status to approved
            await client.query(
                'UPDATE loans SET status = $1, start_date = $2, end_date = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
                ['approved', startDate, endDate, id]
            );
            
            // Get the customer's default account
            const accountResult = await client.query(
                'SELECT * FROM accounts WHERE customer_id = $1 AND account_type = $2 LIMIT 1',
                [loan.customer_id, 'Savings']
            );
            
            if (accountResult.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Customer has no default account');
            }
            
            const account = accountResult.rows[0];
            
            // Add loan amount to the account
            await client.query(
                'UPDATE accounts SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [loan.amount, account.id]
            );
            
            // Create a transaction record
            await client.query(
                `INSERT INTO transactions 
                (account_id, transaction_type, amount, description, status) 
                VALUES ($1, $2, $3, $4, $5)`,
                [account.id, 'loan_disbursement', loan.amount, `Loan #${id} disbursement`, 'completed']
            );
            
            // Generate loan payment schedule
            await this.generatePaymentSchedule(client, id, loan.amount, loan.interest_rate, loan.term_months, startDate);
            
            await client.query('COMMIT');
            
            return await this.findById(id);
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Error approving loan:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async generatePaymentSchedule(client, loanId, amount, interestRate, termMonths, startDate) {
        // Calculate monthly payment
        const monthlyInterestRate = interestRate / 100 / 12;
        const monthlyPayment = (amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -termMonths));
        
        // Generate payment schedule
        for (let i = 1; i <= termMonths; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);
            
            await client.query(
                `INSERT INTO loan_payments 
                (loan_id, payment_date, amount, status) 
                VALUES ($1, $2, $3, $4)`,
                [loanId, paymentDate, monthlyPayment.toFixed(2), 'pending']
            );
        }
    }

    static async rejectLoan(id, reason) {
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                'UPDATE loans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                ['rejected', id]
            );
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error rejecting loan:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getPaymentSchedule(loanId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT * FROM loan_payments 
                WHERE loan_id = $1 
                ORDER BY payment_date ASC`,
                [loanId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting loan payment schedule:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async recordPayment(loanId, paymentId, accountId) {
        let client;
        
        try {
            client = await pool.connect();
            await client.query('BEGIN');
            
            // Get the payment details
            const paymentResult = await client.query(
                'SELECT * FROM loan_payments WHERE id = $1 AND loan_id = $2',
                [paymentId, loanId]
            );
            
            if (paymentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Payment not found');
            }
            
            const payment = paymentResult.rows[0];
            
            if (payment.status !== 'pending') {
                await client.query('ROLLBACK');
                throw new Error('Payment has already been processed');
            }
            
            // Get the account details
            const accountResult = await client.query(
                'SELECT * FROM accounts WHERE id = $1',
                [accountId]
            );
            
            if (accountResult.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Account not found');
            }
            
            const account = accountResult.rows[0];
            
            // Check if the account has sufficient balance
            if (parseFloat(account.balance) < parseFloat(payment.amount)) {
                await client.query('ROLLBACK');
                throw new Error('Insufficient funds');
            }
            
            // Deduct payment amount from account
            await client.query(
                'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [payment.amount, accountId]
            );
            
            // Mark payment as completed
            await client.query(
                'UPDATE loan_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['completed', paymentId]
            );
            
            // Create a transaction record
            await client.query(
                `INSERT INTO transactions 
                (account_id, transaction_type, amount, description, status) 
                VALUES ($1, $2, $3, $4, $5)`,
                [accountId, 'loan_payment', payment.amount, `Loan #${loanId} payment`, 'completed']
            );
            
            // Check if all payments are completed
            const pendingPaymentsResult = await client.query(
                'SELECT COUNT(*) FROM loan_payments WHERE loan_id = $1 AND status = $2',
                [loanId, 'pending']
            );
            
            if (parseInt(pendingPaymentsResult.rows[0].count) === 0) {
                // All payments completed, mark loan as completed
                await client.query(
                    'UPDATE loans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['completed', loanId]
                );
            }
            
            await client.query('COMMIT');
            
            return true;
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Error recording loan payment:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getPendingLoans() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT l.*, 
                lt.name as loan_type_name, 
                c.first_name, 
                c.last_name,
                u.username,
                u.email
                FROM loans l
                JOIN loan_types lt ON l.loan_type_id = lt.id
                JOIN customers c ON l.customer_id = c.id
                JOIN users u ON c.user_id = u.id
                WHERE l.status = 'pending'
                ORDER BY l.created_at DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting pending loans:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async getLoansByStatus(status) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT l.*, 
                lt.name as loan_type_name, 
                c.first_name, 
                c.last_name
                FROM loans l
                JOIN loan_types lt ON l.loan_type_id = lt.id
                JOIN customers c ON l.customer_id = c.id
                WHERE l.status = $1
                ORDER BY l.updated_at DESC`,
                [status]
            );
            return result.rows;
        } catch (error) {
            console.error(`Error getting ${status} loans:`, error);
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
            const result = await client.query('SELECT COUNT(*) as count FROM loans');
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting loans:', error);
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
                `SELECT loans.*, customers.first_name, customers.last_name, loan_types.name as loan_type_name 
                FROM loans
                JOIN customers ON loans.customer_id = customers.id
                JOIN loan_types ON loans.loan_type_id = loan_types.id
                ORDER BY loans.id
                LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding all loans:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }    static async findByStatus(status) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                `SELECT 
                    loans.*,
                    customers.first_name,
                    customers.last_name, 
                    loan_types.name as loan_type_name,
                    loan_types.description as loan_type_description
                FROM loans
                JOIN customers ON loans.customer_id = customers.id
                JOIN loan_types ON loans.loan_type_id = loan_types.id
                WHERE loans.status = $1
                ORDER BY loans.created_at DESC`,
                [status]
            );
            return result.rows;
        } catch (error) {
            console.error(`Error finding loans by status (${status}):`, error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = Loan;
