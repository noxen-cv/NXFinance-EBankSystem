const express = require('express');
const app = express();
const pool = require('./config/database');

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Simple API endpoint for admin dashboard that doesn't depend on existing models
app.get('/api/admin/dashboard', async (req, res) => {
  const client = await pool.connect();
  try {
    // Get customer count
    const customerCountResult = await client.query('SELECT COUNT(*) FROM customers');
    const customerCount = parseInt(customerCountResult.rows[0].count);
    
    // Get approved loans
    const approvedLoansQuery = `
      SELECT l.*, c.first_name, c.last_name, lt.name as loan_type_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'approved'
    `;
    const approvedLoansResult = await client.query(approvedLoansQuery);
    
    // Get pending loans
    const pendingLoansQuery = `
      SELECT l.*, c.first_name, c.last_name, lt.name as loan_type_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'pending'
    `;
    const pendingLoansResult = await client.query(pendingLoansQuery);
    
    // Format loans for display
    const formatLoans = (loans, status) => {
      return loans.map(loan => {
        // Determine a default purpose based on loan type
        let purpose = 'General Purpose';
        switch (loan.loan_type_name) {
          case 'Personal Loan': purpose = 'Emergency Expenses'; break;
          case 'Home Loan': purpose = 'Home Purchase'; break;
          case 'Car Loan': purpose = 'Vehicle Purchase'; break;
          case 'Business Loan': purpose = 'Working Capital'; break;
          case 'Education Loan': purpose = 'Tuition Fees'; break;
        }
        
        return {
          id: loan.id,
          name: `${loan.first_name} ${loan.last_name}`,
          amount: parseFloat(loan.amount),
          cardType: loan.loan_type_name,
          date: new Date(loan.created_at).toLocaleDateString(),
          purpose: purpose,
          status: status
        };
      });
    };
    
    const formattedApprovedLoans = formatLoans(approvedLoansResult.rows, 'Approved');
    const formattedPendingLoans = formatLoans(pendingLoansResult.rows, 'Pending');
    
    // Calculate loan health
    const loanCount = approvedLoansResult.rows.length + pendingLoansResult.rows.length;
    const loanHealth = loanCount > 0 
      ? Math.round((approvedLoansResult.rows.length / loanCount) * 100) 
      : 0;
    
    // Send response
    console.log(`Found ${formattedApprovedLoans.length} approved loans and ${formattedPendingLoans.length} pending loans`);
    res.json({
      success: true,
      admin: { user: { username: 'Admin' } },
      customerCount: customerCount,
      loanHealth: loanHealth,
      availableLimit: 10000000, // Placeholder value
      approvedLoans: formattedApprovedLoans,
      pendingLoans: formattedPendingLoans
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// Start server
const PORT = 3100;
app.listen(PORT, () => {
  console.log(`Simple admin API server running on port ${PORT}`);
});
