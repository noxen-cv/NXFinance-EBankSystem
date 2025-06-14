const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const Account = require('../models/account');
const Card = require('../models/card');
const Loan = require('../models/loan');
const Transaction = require('../models/transaction');
const authMiddleware = require('../middleware/auth');
const { validateCustomerProfile } = require('../middleware/validation');

// Apply authentication middleware to all customer routes
router.use(authMiddleware);

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

// Get customer dashboard data (comprehensive overview)
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer profile not found' });
        }
        
        // Get customer accounts
        const accounts = await Account.findByCustomerId(customer.id);
        
        // Get customer cards
        const cards = await Card.findByCustomerId(customer.id);
        
        // Get customer loans
        const loans = await Loan.findByCustomerId(customer.id);
        
        // Get recent transactions
        const recentTransactions = [];
        for (const account of accounts) {
            const transactions = await Transaction.findByAccountId(account.id, 5); // Limit to 5 recent transactions per account
            recentTransactions.push(...transactions);
        }
        
        // Sort transactions by date (most recent first)
        recentTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
        
        // Calculate total balance across all accounts
        const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
        
        // Return dashboard data
        res.json({
            success: true,
            dashboard: {
                customer: {
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    profile_picture: customer.profile_picture
                },
                accounts: accounts,
                cards: cards,
                loans: loans,
                recentTransactions: recentTransactions.slice(0, 10), // Limit to 10 most recent transactions overall
                summary: {
                    totalBalance: totalBalance,
                    totalAccounts: accounts.length,
                    totalCards: cards.length,
                    totalLoans: loans.length
                }
            }
        });
    } catch (error) {
        console.error('Error retrieving dashboard data:', error);
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
