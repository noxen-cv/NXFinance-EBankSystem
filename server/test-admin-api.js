const express = require('express');
const router = express.Router();
const Customer = require('./models/customer');
const Admin = require('./models/admin');
const Account = require('./models/account');
const Card = require('./models/card');
const Loan = require('./models/loan');
const Transaction = require('./models/transaction');
const User = require('./models/user');

/**
 * This script creates a direct API endpoint to test the admin dashboard data
 * without needing authentication. Only for testing purposes.
 */

const app = express();
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Direct test endpoint for admin dashboard
app.get('/api/admin/dashboard', async (req, res) => {
  try {
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
      // Generate a default purpose based on loan type
      const defaultPurpose = getLoanPurpose(loan.loan_type_name);
      
      return {
        id: loan.id,
        name: `${loan.first_name} ${loan.last_name}`,
        amount: parseFloat(loan.amount),
        cardType: loan.loan_type_name,
        date: new Date(loan.created_at).toLocaleDateString(),
        purpose: defaultPurpose,
        status: 'Approved'
      };
    });
    
    // Get pending loan applications
    const pendingLoans = await Loan.findByStatus('pending');
    
    // Format pending loans for the dashboard
    const formattedPendingLoans = pendingLoans.map(loan => {
      // Generate a default purpose based on loan type
      const defaultPurpose = getLoanPurpose(loan.loan_type_name);
      
      return {
        id: loan.id,
        name: `${loan.first_name} ${loan.last_name}`,
        amount: parseFloat(loan.amount),
        cardType: loan.loan_type_name,
        date: new Date(loan.created_at).toLocaleDateString(),
        purpose: defaultPurpose,
        status: 'Pending'
      };
    });
    
    // Helper function to get a purpose based on loan type
    function getLoanPurpose(loanType) {
      switch (loanType) {
        case 'Personal Loan':
          return 'Emergency Expenses';
        case 'Home Loan':
          return 'Home Purchase';
        case 'Car Loan':
          return 'Vehicle Purchase';
        case 'Business Loan':
          return 'Working Capital';
        case 'Education Loan':
          return 'Tuition Fees';
        default:
          return 'General Purpose';
      }
    }
    
    // Calculate loan health percentage
    const loanHealth = loanCount > 0 
      ? Math.round((approvedLoans.length / loanCount) * 100) 
      : 0;
    
    // Calculate available limit (placeholder value)
    const availableLimit = 10000000;
    
    console.log(`Admin Dashboard API - Found ${formattedApprovedLoans.length} approved loans, ${formattedPendingLoans.length} pending loans`);
      // Return dashboard data - format it to match what admin.js expects
    res.json({
      admin: { user: { username: 'Admin' } },
      customerCount,
      loanHealth,
      availableLimit,
      approvedLoans: formattedApprovedLoans,
      pendingLoans: formattedPendingLoans 
    });
  } catch (error) {
    console.error('Error in test admin dashboard endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Special test endpoint to check loan data
app.get('/api/test/loans', async (req, res) => {
  try {
    const approved = await Loan.findByStatus('approved');
    const pending = await Loan.findByStatus('pending');
    
    res.json({
      success: true,
      approved: approved,
      pending: pending
    });
  } catch (error) {
    console.error('Error in test loans endpoint:', error);
    res.status(500).json({
      success: false, 
      error: error.message
    });
  }
});

// Start server
const PORT = 3100;
app.listen(PORT, () => {
  console.log(`Test API server running on port ${PORT}`);
});

module.exports = app;
