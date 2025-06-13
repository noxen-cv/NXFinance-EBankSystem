const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const Customer = require('../models/customer');
const authMiddleware = require('../middleware/auth');
const { validateAccountCreation } = require('../middleware/validation');

// Apply authentication middleware to all account routes
router.use(authMiddleware);

// Get all accounts for the authenticated customer
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const accounts = await Account.findByCustomerId(customer.id);
        
        res.json({
            success: true,
            accounts: accounts
        });
    } catch (error) {
        console.error('Error retrieving accounts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific account details
router.get('/:id', async (req, res) => {
    try {
        const accountId = req.params.id;
        const account = await Account.findById(accountId);
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        // Check if the account belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || account.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to view this account' });
        }
        
        res.json({
            success: true,
            account: account
        });
    } catch (error) {
        console.error('Error retrieving account:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new account
router.post('/', validateAccountCreation, async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Generate a unique account number
        const accountNumber = `A${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Create the account
        const account = await Account.create({
            customer_id: customer.id,
            account_number: accountNumber,
            account_type: req.body.account_type,
            balance: req.body.initial_deposit || 0,
            is_active: true
        });
        
        // Create an initial deposit transaction if provided
        if (req.body.initial_deposit && req.body.initial_deposit > 0) {
            await Transaction.create({
                account_id: account.id,
                transaction_type: 'deposit',
                amount: req.body.initial_deposit,
                description: 'Initial deposit',
                status: 'completed'
            });
        }
        
        res.status(201).json({
            success: true,
            account: account
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update account status (activate/deactivate)
router.put('/:id/status', async (req, res) => {
    try {
        const accountId = req.params.id;
        const { is_active } = req.body;
        
        if (is_active === undefined) {
            return res.status(400).json({ error: 'Account status (is_active) is required' });
        }
        
        const account = await Account.findById(accountId);
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        // Check if the account belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || account.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to update this account' });
        }
        
        // Update account status
        const updatedAccount = await Account.update(accountId, { is_active });
        
        res.json({
            success: true,
            account: updatedAccount
        });
    } catch (error) {
        console.error('Error updating account status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get account statements/transactions
router.get('/:id/statements', async (req, res) => {
    try {
        const accountId = req.params.id;
        const account = await Account.findById(accountId);
        
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        // Check if the account belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || account.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to view these statements' });
        }
        
        // Get date range from query parameters
        const startDate = req.query.start_date ? new Date(req.query.start_date) : null;
        const endDate = req.query.end_date ? new Date(req.query.end_date) : null;
        
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get transactions for the account within date range
        const transactions = await Transaction.findByAccountId(
            accountId,
            limit,
            offset,
            startDate,
            endDate
        );
        
        // Get total transaction count for pagination
        const total = await Transaction.countByAccountId(accountId, startDate, endDate);
        
        res.json({
            success: true,
            account: {
                id: account.id,
                account_number: account.account_number,
                account_type: account.account_type,
                balance: account.balance
            },
            transactions: transactions,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error retrieving statements:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
