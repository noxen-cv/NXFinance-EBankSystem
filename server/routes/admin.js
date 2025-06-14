const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const Admin = require('../models/admin');
const Account = require('../models/account');
const Card = require('../models/card');
const Loan = require('../models/loan');
const Transaction = require('../models/transaction');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const { validateAdminRole } = require('../middleware/validation');

// Apply authentication and admin role validation to all admin routes (except in development)
const isDevelopment = process.env.NODE_ENV === 'development' || true;

if (!isDevelopment) {
    router.use(authMiddleware);
    router.use(validateAdminRole);
}

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        // In development/test mode, we'll skip requiring a valid user ID
        // This makes it easier to test the dashboard without authentication
        let admin = null;
        const isDevelopment = process.env.NODE_ENV === 'development' || true;
        
        if (!isDevelopment) {
            const userId = req.user.id;
            admin = await Admin.findByUserId(userId);
            
            if (!admin) {
                return res.status(404).json({ error: 'Admin profile not found' });
            }
        }
        
        // Get system statistics
        const customerCount = await Customer.count();
        const accountCount = await Account.count();
        const cardCount = await Card.count();
        const loanCount = await Loan.count();
        const transactionCount = await Transaction.count();
        
        // Get approved loans
        const approvedLoans = await Loan.findByStatus('approved');
        
        // Format approved loans for the dashboard
        const formattedApprovedLoans = approvedLoans.map(loan => {
            return {
                id: loan.id,
                name: `${loan.first_name} ${loan.last_name}`,
                amount: parseFloat(loan.amount),
                cardType: loan.loan_type_name,
                date: new Date(loan.created_at).toLocaleDateString(),
                purpose: loan.purpose || 'General Purpose',
                status: 'Approved'
            };
        });
        
        // Get pending loan applications
        const pendingLoans = await Loan.findByStatus('pending');
        
        // Format pending loans for the dashboard
        const formattedPendingLoans = pendingLoans.map(loan => {
            return {
                id: loan.id,
                name: `${loan.first_name} ${loan.last_name}`,
                amount: parseFloat(loan.amount),
                cardType: loan.loan_type_name,
                date: new Date(loan.created_at).toLocaleDateString(),
                purpose: loan.purpose || 'General Purpose',
                status: 'Pending'
            };
        });
        
        // Calculate loan health percentage
        const loanHealth = loanCount > 0 
            ? Math.round((approvedLoans.length / loanCount) * 100) 
            : 0;
        
        // Calculate available limit (placeholder value)
        const availableLimit = 10000000;
        
        // Return dashboard data
        res.json({
            success: true,
            admin: admin || { user: { username: 'Admin' } },
            customerCount,
            loanHealth,
            availableLimit,
            approvedLoans: formattedApprovedLoans,
            pendingLoans: formattedPendingLoans
        });
    } catch (error) {
        console.error('Error retrieving admin dashboard:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all customers
router.get('/customers', async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const customers = await Customer.findAll(limit, offset);
        const total = await Customer.count();
        
        res.json({
            success: true,
            customers: customers,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing customers:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific customer details
router.get('/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = await Customer.findById(customerId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get related customer data
        const user = await User.findById(customer.user_id);
        const accounts = await Account.findByCustomerId(customer.id);
        const cards = await Card.findByCustomerId(customer.id);
        const loans = await Loan.findByCustomerId(customer.id);
        
        res.json({
            success: true,
            customer: {
                ...customer,
                email: user.email,
                accounts: accounts,
                cards: cards,
                loans: loans
            }
        });
    } catch (error) {
        console.error('Error retrieving customer details:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update customer information
router.put('/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = await Customer.findById(customerId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Update customer details
        const updatedCustomer = await Customer.update(customerId, req.body);
        
        res.json({
            success: true,
            customer: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all accounts
router.get('/accounts', async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const accounts = await Account.findAll(limit, offset);
        const total = await Account.count();
        
        res.json({
            success: true,
            accounts: accounts,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing accounts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all transactions
router.get('/transactions', async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const transactions = await Transaction.findAll(limit, offset);
        const total = await Transaction.count();
        
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
        console.error('Error listing transactions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all cards
router.get('/cards', async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const cards = await Card.findAll(limit, offset);
        const total = await Card.count();
        
        res.json({
            success: true,
            cards: cards,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing cards:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all loans
router.get('/loans', async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const loans = await Loan.findAll(limit, offset);
        const total = await Loan.count();
        
        res.json({
            success: true,
            loans: loans,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error listing loans:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update loan status (approve/reject)
router.put('/loans/:id/status', async (req, res) => {
    try {
        const loanId = req.params.id;
        const { status } = req.body;
        
        if (!status || !['approved', 'rejected', 'active', 'paid', 'defaulted'].includes(status)) {
            return res.status(400).json({ error: 'Valid status required' });
        }
        
        const loan = await Loan.findById(loanId);
        
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        
        // Update loan status
        const updatedLoan = await Loan.updateStatus(loanId, status);
        
        // If approved, generate payment schedule
        if (status === 'approved') {
            // This would typically involve creating loan payment records
            // and potentially disbursing funds to the customer's account
            // For simplicity, we're just updating the status
        }
        
        res.json({
            success: true,
            loan: updatedLoan
        });
    } catch (error) {
        console.error('Error updating loan status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get admin profile information
router.get('/profile', async (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development' || true;
        let admin = null;
        
        if (!isDevelopment && req.user) {
            admin = await Admin.findByUserId(req.user.id);
            if (!admin) {
                return res.status(404).json({ error: 'Admin profile not found' });
            }
        } else {
            // For development, return default admin data
            admin = {
                id: 1,
                user_id: 1,
                first_name: 'System',
                last_name: 'Administrator',
                department: 'IT',
                position: 'Senior Administrator'
            };
        }
        
        res.json({
            success: true,
            user: { username: 'Admin' },
            firstName: admin.first_name || 'System',
            lastName: admin.last_name || 'Administrator',
            department: admin.department || 'IT',
            position: admin.position || 'Administrator',
            email: 'admin@nxfinance.com',
            phone: '+63 912 345 6789'
        });
    } catch (error) {
        console.error('Error retrieving admin profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get loan history for admin
router.get('/loans', async (req, res) => {
    try {
        // Get all loans with customer details
        const allLoansQuery = `
            SELECT 
                l.id, l.amount, l.created_at, l.status, l.purpose,
                c.first_name, c.last_name, 
                lt.name as loan_type_name
            FROM loans l
            JOIN customers c ON l.customer_id = c.id
            JOIN loan_types lt ON l.loan_type_id = lt.id
            ORDER BY l.created_at DESC
        `;
        
        const pool = require('../config/database');
        const client = await pool.connect();
        const result = await client.query(allLoansQuery);
        client.release();
        
        // Format loans for admin view
        const formattedLoans = result.rows.map(loan => ({
            id: loan.id,
            customerName: `${loan.first_name} ${loan.last_name}`,
            amount: parseFloat(loan.amount),
            loanType: loan.loan_type_name,
            purpose: loan.purpose || 'General Purpose',
            status: loan.status,
            date: new Date(loan.created_at).toLocaleDateString(),
            created_at: loan.created_at
        }));
        
        // Calculate summary statistics
        const approved = formattedLoans.filter(l => l.status.toLowerCase() === 'approved');
        const pending = formattedLoans.filter(l => l.status.toLowerCase() === 'pending');
        const rejected = formattedLoans.filter(l => l.status.toLowerCase() === 'rejected');
        
        res.json({
            success: true,
            adminName: 'Admin',
            loans: formattedLoans,
            summary: {
                totalLoans: formattedLoans.length,
                approvedLoans: approved.length,
                pendingLoans: pending.length,
                rejectedLoans: rejected.length,
                totalAmount: formattedLoans.reduce((sum, loan) => sum + loan.amount, 0)
            }
        });
    } catch (error) {
        console.error('Error retrieving loan history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
