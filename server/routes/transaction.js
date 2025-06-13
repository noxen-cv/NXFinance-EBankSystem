const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const Account = require('../models/account');
const Customer = require('../models/customer');
const authMiddleware = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validation');
const pool = require('../config/database');

// Apply authentication middleware to all transaction routes
router.use(authMiddleware);

// Get all transactions for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get all accounts for this customer
        const accounts = await Account.findByCustomerId(customer.id);
        const accountIds = accounts.map(account => account.id);
        
        if (accountIds.length === 0) {
            return res.json({
                success: true,
                transactions: []
            });
        }
        
        // Get date range from query parameters
        const startDate = req.query.start_date ? new Date(req.query.start_date) : null;
        const endDate = req.query.end_date ? new Date(req.query.end_date) : null;
        
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get transactions for all customer accounts
        const transactions = await Transaction.findByAccountIds(
            accountIds,
            limit,
            offset,
            startDate,
            endDate
        );
        
        // Get total transaction count for pagination
        const total = await Transaction.countByAccountIds(accountIds, startDate, endDate);
        
        res.json({
            success: true,
            transactions: transactions,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific transaction details
router.get('/:id', async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Check if the transaction belongs to the authenticated user's account
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const account = await Account.findById(transaction.account_id);
        
        if (!account || account.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to view this transaction' });
        }
        
        res.json({
            success: true,
            transaction: transaction
        });
    } catch (error) {
        console.error('Error retrieving transaction:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Make a transfer between accounts
router.post('/transfer', validateTransaction, async (req, res) => {
    const { from_account_id, to_account_id, amount, description } = req.body;
    let client;
    
    try {
        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }
        
        // Check if the from_account belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const fromAccount = await Account.findById(from_account_id);
        
        if (!fromAccount) {
            return res.status(404).json({ error: 'Source account not found' });
        }
        
        if (fromAccount.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to transfer from this account' });
        }
        
        // Check if the account has sufficient balance
        if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Check if the destination account exists
        const toAccount = await Account.findById(to_account_id);
        
        if (!toAccount) {
            return res.status(404).json({ error: 'Destination account not found' });
        }
        
        // Start transaction
        client = await pool.connect();
        await client.query('BEGIN');
        
        // Deduct amount from source account
        const updatedFromAccount = await Account.updateBalance(from_account_id, -parseFloat(amount), client);
        
        // Add amount to destination account
        const updatedToAccount = await Account.updateBalance(to_account_id, parseFloat(amount), client);
        
        // Create transaction records
        const reference = `TRF${Date.now()}`;
        
        // Source transaction
        const sourceTransaction = await Transaction.create({
            account_id: from_account_id,
            transaction_type: 'transfer',
            amount: parseFloat(amount),
            description: description || 'Transfer to another account',
            reference_number: reference,
            status: 'completed'
        }, client);
        
        // Destination transaction
        const destTransaction = await Transaction.create({
            account_id: to_account_id,
            transaction_type: 'deposit',
            amount: parseFloat(amount),
            description: description || 'Transfer from another account',
            reference_number: reference,
            status: 'completed'
        }, client);
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Transfer completed successfully',
            reference: reference,
            fromAccount: {
                id: updatedFromAccount.id,
                account_number: updatedFromAccount.account_number,
                balance: updatedFromAccount.balance
            },
            toAccount: {
                id: updatedToAccount.id,
                account_number: updatedToAccount.account_number,
                balance: updatedToAccount.balance
            }
        });
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error making transfer:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// Make a deposit
router.post('/deposit', validateTransaction, async (req, res) => {
    const { account_id, amount, description } = req.body;
    let client;
    
    try {
        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }
        
        // Check if the account belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const account = await Account.findById(account_id);
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        if (account.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to deposit to this account' });
        }
        
        // Start transaction
        client = await pool.connect();
        await client.query('BEGIN');
        
        // Update account balance
        const updatedAccount = await Account.updateBalance(account_id, parseFloat(amount), client);
        
        // Create transaction record
        const reference = `DEP${Date.now()}`;
        const transaction = await Transaction.create({
            account_id: account_id,
            transaction_type: 'deposit',
            amount: parseFloat(amount),
            description: description || 'Deposit',
            reference_number: reference,
            status: 'completed'
        }, client);
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Deposit completed successfully',
            reference: reference,
            account: {
                id: updatedAccount.id,
                account_number: updatedAccount.account_number,
                balance: updatedAccount.balance
            },
            transaction: transaction
        });
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error making deposit:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// Make a withdrawal
router.post('/withdrawal', validateTransaction, async (req, res) => {
    const { account_id, amount, description } = req.body;
    let client;
    
    try {
        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }
        
        // Check if the account belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const account = await Account.findById(account_id);
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        if (account.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to withdraw from this account' });
        }
        
        // Check if the account has sufficient balance
        if (parseFloat(account.balance) < parseFloat(amount)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Start transaction
        client = await pool.connect();
        await client.query('BEGIN');
        
        // Update account balance
        const updatedAccount = await Account.updateBalance(account_id, -parseFloat(amount), client);
        
        // Create transaction record
        const reference = `WDR${Date.now()}`;
        const transaction = await Transaction.create({
            account_id: account_id,
            transaction_type: 'withdrawal',
            amount: parseFloat(amount),
            description: description || 'Withdrawal',
            reference_number: reference,
            status: 'completed'
        }, client);
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Withdrawal completed successfully',
            reference: reference,
            account: {
                id: updatedAccount.id,
                account_number: updatedAccount.account_number,
                balance: updatedAccount.balance
            },
            transaction: transaction
        });
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error making withdrawal:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (client) {
            client.release();
        }
    }
});

module.exports = router;
