const pool = require('../config/database');

class LoanPayment {
    static async findAll() {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM loan_payments ORDER BY payment_date'
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding loan payments:', error);
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
                'SELECT * FROM loan_payments WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding loan payment by ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async findByLoanId(loanId) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(
                'SELECT * FROM loan_payments WHERE loan_id = $1 ORDER BY payment_date',
                [loanId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding loan payments by loan ID:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async create(paymentData) {
        const {
            loan_id,
            payment_date,
            amount,
            status = 'pending'
        } = paymentData;
        
        let client;
        
        try {
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO loan_payments 
                (loan_id, payment_date, amount, status) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *`,
                [loan_id, payment_date, amount, status]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating loan payment:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async update(id, paymentData) {
        const {
            payment_date,
            amount,
            status
        } = paymentData;
        
        let client;
        
        try {
            client = await pool.connect();
            
            // Build the update query dynamically based on provided fields
            let updateQuery = 'UPDATE loan_payments SET updated_at = CURRENT_TIMESTAMP';
            const values = [];
            const params = [];
            
            if (payment_date !== undefined) {
                params.push(payment_date);
                values.push(`payment_date = $${params.length}`);
            }
            
            if (amount !== undefined) {
                params.push(amount);
                values.push(`amount = $${params.length}`);
            }
            
            if (status !== undefined) {
                params.push(status);
                values.push(`status = $${params.length}`);
            }
            
            // If no fields to update, return the current loan payment
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
            console.error('Error updating loan payment:', error);
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
                'UPDATE loan_payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [status, id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating loan payment status:', error);
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
                'DELETE FROM loan_payments WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting loan payment:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    static async generatePaymentSchedule(loanId, amount, interestRate, termMonths, startDate) {
        let client;
        try {
            client = await pool.connect();
            
            await client.query('BEGIN');
            
            // Parse start date if it's a string
            const loanStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
            
            // Calculate monthly payment using the formula:
            // P = A * r * (1 + r)^n / ((1 + r)^n - 1)
            // Where:
            // P = Monthly payment
            // A = Loan amount
            // r = Monthly interest rate (annual rate / 12 / 100)
            // n = Total number of payments (term in months)
            
            const monthlyRate = interestRate / 12 / 100;
            const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / 
                                  (Math.pow(1 + monthlyRate, termMonths) - 1);
            
            let remainingBalance = amount;
            let paymentDate = new Date(loanStartDate);
            
            // Generate payment schedule
            for (let i = 1; i <= termMonths; i++) {
                paymentDate = new Date(paymentDate);
                paymentDate.setMonth(paymentDate.getMonth() + 1);
                
                const interestPayment = remainingBalance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                
                remainingBalance -= principalPayment;
                
                // Insert payment record
                await client.query(
                    `INSERT INTO loan_payments 
                    (loan_id, payment_date, amount, status) 
                    VALUES ($1, $2, $3, $4)`,
                    [loanId, paymentDate, monthlyPayment.toFixed(2), 'scheduled']
                );
            }
            
            await client.query('COMMIT');
            return this.findByLoanId(loanId);
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Error generating payment schedule:', error);
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = LoanPayment;
