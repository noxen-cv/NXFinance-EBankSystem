/**
 * Direct API - No database connection required
 * This file provides a simple Express API server that returns hardcoded data
 */

const express = require('express');
const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Hardcoded admin dashboard data
app.get('/api/admin/dashboard', (req, res) => {
  console.log('Admin dashboard API called');
  
  // Return hardcoded data
  res.json({
    success: true,
    admin: { user: { username: 'Admin' } },
    customerCount: 10,
    loanHealth: 50,
    availableLimit: 10000000,
    approvedLoans: [
      {
        id: 28,
        name: 'John Smith',
        amount: 991026,
        cardType: 'Home Loan',
        date: '2025-06-10',
        purpose: 'Home Purchase',
        status: 'Approved'
      },
      {
        id: 29,
        name: 'Maria Santos',
        amount: 1843242,
        cardType: 'Business Loan',
        date: '2025-06-09',
        purpose: 'Working Capital',
        status: 'Approved'
      },
      {
        id: 30,
        name: 'David Lee',
        amount: 1919885,
        cardType: 'Business Loan',
        date: '2025-06-08',
        purpose: 'Business Expansion',
        status: 'Approved'
      },
      {
        id: 31,
        name: 'Sofia Garcia',
        amount: 1232325,
        cardType: 'Car Loan',
        date: '2025-06-07',
        purpose: 'Vehicle Purchase',
        status: 'Approved'
      },
      {
        id: 32,
        name: 'Michael Tan',
        amount: 795094,
        cardType: 'Education Loan',
        date: '2025-06-06',
        purpose: 'Tuition Fees',
        status: 'Approved'
      }
    ],
    pendingLoans: [
      {
        id: 33,
        name: 'Anna Reyes',
        amount: 1884106,
        cardType: 'Car Loan',
        date: '2025-06-05',
        purpose: 'Vehicle Purchase',
        status: 'Pending'
      },
      {
        id: 34,
        name: 'Robert Cruz',
        amount: 928274,
        cardType: 'Education Loan',
        date: '2025-06-04',
        purpose: 'Tuition Fees',
        status: 'Pending'
      },
      {
        id: 35,
        name: 'Jessica Wong',
        amount: 53210,
        cardType: 'Personal Loan',
        date: '2025-06-03',
        purpose: 'Emergency Expenses',
        status: 'Pending'
      },
      {
        id: 36,
        name: 'Daniel Lim',
        amount: 3997104,
        cardType: 'Home Loan',
        date: '2025-06-02',
        purpose: 'Home Purchase',
        status: 'Pending'
      },
      {
        id: 37,
        name: 'Patricia Mendoza',
        amount: 2909327,
        cardType: 'Home Loan',
        date: '2025-06-01',
        purpose: 'Home Renovation',
        status: 'Pending'
      }
    ]
  });
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Direct API server running on port ${PORT}`);
});
