const express = require('express');
const router = express.Router();
const Loan = require('../models/loan');
const LoanType = require('../models/loanType');
const LoanPayment = require('../models/loanPayment');
const Customer = require('../models/customer');
const authMiddleware = require('../middleware/auth');
const { validateLoanApplication } = require('../middleware/validation');

// Apply authentication middleware to all loan routes
router.use(authMiddleware);

// Get all loans for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const loans = await Loan.findByCustomerId(customer.id);
        
        // Enhance loan details with loan type information
        const enhancedLoans = [];
        for (const loan of loans) {
            const loanType = await LoanType.findById(loan.loan_type_id);
            enhancedLoans.push({
                ...loan,
                loan_type: loanType ? {
                    name: loanType.name,
                    description: loanType.description
                } : null
            });
        }
        
        res.json({
            success: true,
            loans: enhancedLoans
        });
    } catch (error) {
        console.error('Error retrieving loans:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific loan details
router.get('/:id', async (req, res) => {
    try {
        const loanId = req.params.id;
        const loan = await Loan.findById(loanId);
        
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        
        // Check if the loan belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || loan.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to view this loan' });
        }
        
        // Get loan type details
        const loanType = await LoanType.findById(loan.loan_type_id);
        
        res.json({
            success: true,
            loan: {
                ...loan,
                loan_type: loanType ? {
                    name: loanType.name,
                    description: loanType.description
                } : null
            }
        });
    } catch (error) {
        console.error('Error retrieving loan:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Apply for a new loan
router.post('/', validateLoanApplication, async (req, res) => {
    try {
        const { 
            loan_type_id, 
            amount, 
            term_months, 
            purpose
        } = req.body;
        
        // Check if the user is authenticated and get customer profile
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Check if the loan type exists
        const loanType = await LoanType.findById(loan_type_id);
        
        if (!loanType) {
            return res.status(404).json({ error: 'Loan type not found' });
        }
        
        // Validate loan amount and term against loan type constraints
        if (amount < loanType.min_amount || amount > loanType.max_amount) {
            return res.status(400).json({ 
                error: `Loan amount must be between ${loanType.min_amount} and ${loanType.max_amount}` 
            });
        }
        
        if (term_months < loanType.min_term || term_months > loanType.max_term) {
            return res.status(400).json({ 
                error: `Loan term must be between ${loanType.min_term} and ${loanType.max_term} months` 
            });
        }
        
        // Calculate interest rate based on loan type and potentially customer credit score
        // For simplicity, we're using the base rate from the loan type
        const interestRate = loanType.interest_rate;
        
        // Calculate start and end dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(term_months));
        
        // Calculate monthly payment
        const monthlyRate = interestRate / 12 / 100;
        const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term_months)) / 
                              (Math.pow(1 + monthlyRate, term_months) - 1);
        
        // Create the loan application
        const loan = await Loan.create({
            customer_id: customer.id,
            loan_type_id: loan_type_id,
            amount: amount,
            interest_rate: interestRate,
            term_months: term_months,
            monthly_payment: monthlyPayment.toFixed(2),
            start_date: startDate,
            end_date: endDate,
            status: 'pending',
            purpose: purpose || '',
            remaining_balance: amount
        });
        
        res.status(201).json({
            success: true,
            message: 'Loan application submitted successfully',
            loan: {
                id: loan.id,
                loan_type: loanType.name,
                amount: loan.amount,
                interest_rate: loan.interest_rate,
                term_months: loan.term_months,
                monthly_payment: loan.monthly_payment,
                status: loan.status
            }
        });
    } catch (error) {
        console.error('Error applying for loan:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get available loan types
router.get('/types', async (req, res) => {
    try {
        const loanTypes = await LoanType.findAll();
        
        res.json({
            success: true,
            loan_types: loanTypes
        });
    } catch (error) {
        console.error('Error retrieving loan types:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get loan payment schedule
router.get('/:id/payments', async (req, res) => {
    try {
        const loanId = req.params.id;
        const loan = await Loan.findById(loanId);
        
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        
        // Check if the loan belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || loan.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to view these payments' });
        }
        
        // Get loan payments
        const payments = await LoanPayment.findByLoanId(loanId);
        
        res.json({
            success: true,
            loan: {
                id: loan.id,
                amount: loan.amount,
                interest_rate: loan.interest_rate,
                term_months: loan.term_months,
                monthly_payment: loan.monthly_payment,
                remaining_balance: loan.remaining_balance,
                status: loan.status
            },
            payments: payments
        });
    } catch (error) {
        console.error('Error retrieving loan payments:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Make a loan payment
router.post('/:id/payments', async (req, res) => {
    const { amount } = req.body;
    let client;
    
    try {
        const loanId = req.params.id;
        
        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid payment amount required' });
        }
        
        const loan = await Loan.findById(loanId);
        
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        
        // Check if the loan belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || loan.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to make payments on this loan' });
        }
        
        // Check if loan is active
        if (loan.status !== 'approved' && loan.status !== 'active') {
            return res.status(400).json({ error: `Cannot make payment on a loan with status: ${loan.status}` });
        }
        
        // Create payment record
        const payment = await LoanPayment.create({
            loan_id: loanId,
            payment_date: new Date(),
            amount: parseFloat(amount),
            status: 'completed'
        });
        
        // Update loan remaining balance
        const remainingBalance = parseFloat(loan.remaining_balance) - parseFloat(amount);
        let status = loan.status;
        
        if (remainingBalance <= 0) {
            // Loan is paid off
            status = 'paid';
        } else if (status === 'approved') {
            // First payment made, loan is now active
            status = 'active';
        }
        
        const updatedLoan = await Loan.update(loanId, {
            remaining_balance: Math.max(0, remainingBalance).toFixed(2),
            status: status
        });
        
        res.json({
            success: true,
            message: 'Payment successful',
            payment: payment,
            loan: {
                id: updatedLoan.id,
                remaining_balance: updatedLoan.remaining_balance,
                status: updatedLoan.status
            }
        });
    } catch (error) {
        console.error('Error making loan payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
