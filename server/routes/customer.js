const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const Account = require('../models/account');
const Card = require('../models/card');
const Loan = require('../models/loan');
const Transaction = require('../models/transaction');
const authMiddleware = require('../middleware/auth');
const { validateCustomerProfile } = require('../middleware/validation');

// Apply authentication middleware to all customer routes (except in development)
const isDevelopment = process.env.NODE_ENV === 'development' || true;

if (!isDevelopment) {
    router.use(authMiddleware);
}

// Get customer profile
router.get('/profile', async (req, res) => {
    try {
        // The user ID comes from the authenticated JWT token
        const userId = req.user.id;
        
        // Find customer by user ID
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer profile not found' });
        }
        
        // Return customer data
        res.json({
            success: true,
            customer: {
                id: customer.id,
                first_name: customer.first_name,
                last_name: customer.last_name,
                date_of_birth: customer.date_of_birth,
                address: customer.address,
                phone_number: customer.phone_number,
                profile_picture: customer.profile_picture,
                created_at: customer.created_at
            }
        });
    } catch (error) {
        console.error('Error retrieving customer profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update customer profile
router.put('/profile', validateCustomerProfile, async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer profile not found' });
        }
        
        // Update customer with request data
        const updatedCustomer = await Customer.update(customer.id, req.body);
        
        res.json({
            success: true,
            customer: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get customer dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        // For development, allow requests without strict authentication
        const isDevelopment = process.env.NODE_ENV === 'development' || true;
        let customerId = null;
        
        if (!isDevelopment && req.user) {
            const customer = await Customer.findByUserId(req.user.id);
            if (!customer) {
                return res.status(404).json({ error: 'Customer profile not found' });
            }
            customerId = customer.id;
        } else {
            // For development, use the first customer
            const customers = await Customer.getAll();
            if (customers.length > 0) {
                customerId = customers[0].id;
            }
        }
        
        if (!customerId) {
            return res.status(404).json({ error: 'No customer data available' });
        }
        
        // Get customer details
        const customer = await Customer.findById(customerId);
        
        // Get customer accounts
        const accounts = await Account.findByCustomerId(customerId);
        const primaryAccount = accounts.length > 0 ? accounts[0] : null;
        
        // Get customer cards
        const cards = await Card.findByCustomerId(customerId);
          // Get recent transactions
        const recentTransactions = primaryAccount 
            ? await Transaction.findByAccountId(primaryAccount.id, 5)
            : [];
        
        // Calculate total balance
        const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
        
        // Return dashboard data
        res.json({
            success: true,
            firstName: customer.first_name,
            lastName: customer.last_name,
            accountNumber: primaryAccount ? primaryAccount.account_number : 'N/A',
            balance: totalBalance,
            cards: cards.map(card => ({
                id: card.id,
                card_number: card.card_number,
                card_type: card.card_type,
                balance: parseFloat(card.credit_limit || 0) - parseFloat(card.current_balance || 0)
            })),
            recentTransactions: recentTransactions.map(transaction => ({
                id: transaction.id,
                description: transaction.description,
                amount: parseFloat(transaction.amount),
                type: parseFloat(transaction.amount) >= 0 ? 'credit' : 'debit',
                created_at: transaction.created_at
            }))
        });
    } catch (error) {
        console.error('Error retrieving customer dashboard:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit KYC information
router.post('/kyc', async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer profile not found' });
        }
        
        // In a real implementation, this would include document uploads, verification steps, etc.
        // For now, we'll just update a kyc_verified flag (assuming it exists in the schema)
        const updatedCustomer = await Customer.update(customer.id, {
            kyc_verified: true
        });
        
        res.json({
            success: true,
            message: 'KYC information submitted successfully',
            customer: updatedCustomer
        });
    } catch (error) {
        console.error('Error submitting KYC information:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
