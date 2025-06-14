const express = require('express');
const app = express();
const pool = require('./config/database');
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

// API endpoint for admin dashboard that connects directly to the database
app.get('/api/admin/dashboard', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');
    
    // Get customer count
    const customerCountResult = await client.query('SELECT COUNT(*) FROM customers');
    const customerCount = parseInt(customerCountResult.rows[0].count);
    console.log(`Found ${customerCount} customers`);
    
    // Get approved loans with customer details
    const approvedLoansQuery = `
      SELECT 
        l.id, l.amount, l.created_at, l.status, 
        c.first_name, c.last_name, 
        lt.name as loan_type_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'approved' OR l.status = 'Approved'
      ORDER BY l.created_at DESC
    `;
    
    const approvedLoansResult = await client.query(approvedLoansQuery);
    console.log(`Found ${approvedLoansResult.rows.length} approved loans`);
    
    // Get pending loans with customer details
    const pendingLoansQuery = `
      SELECT 
        l.id, l.amount, l.created_at, l.status, 
        c.first_name, c.last_name, 
        lt.name as loan_type_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'pending' OR l.status = 'Pending'
      ORDER BY l.created_at DESC
    `;
    
    const pendingLoansResult = await client.query(pendingLoansQuery);
    console.log(`Found ${pendingLoansResult.rows.length} pending loans`);
    
    // Format approved loans
    const formattedApprovedLoans = approvedLoansResult.rows.map(loan => {
      // Generate a default purpose based on loan type
      const purpose = getLoanPurpose(loan.loan_type_name);
      
      return {
        id: loan.id,
        name: `${loan.first_name} ${loan.last_name}`,
        amount: parseFloat(loan.amount),
        cardType: loan.loan_type_name,
        date: new Date(loan.created_at).toLocaleDateString(),
        purpose: purpose,
        status: 'Approved'
      };
    });
    
    // Format pending loans
    const formattedPendingLoans = pendingLoansResult.rows.map(loan => {
      // Generate a default purpose based on loan type
      const purpose = getLoanPurpose(loan.loan_type_name);
      
      return {
        id: loan.id,
        name: `${loan.first_name} ${loan.last_name}`,
        amount: parseFloat(loan.amount),
        cardType: loan.loan_type_name,
        date: new Date(loan.created_at).toLocaleDateString(),
        purpose: purpose,
        status: 'Pending'
      };
    });
    
    // Calculate loan health percentage (approved loans / total loans)
    const totalLoanCount = await client.query('SELECT COUNT(*) FROM loans');
    const totalLoans = parseInt(totalLoanCount.rows[0].count);
    const loanHealth = totalLoans > 0 
      ? Math.round((approvedLoansResult.rowCount / totalLoans) * 100) 
      : 50; // Default to 50% if no loans
    
    // Get available limit (just a placeholder value)
    const availableLimit = 10000000;
    
    // Return dashboard data
    res.json({
      admin: { user: { username: 'Admin' } },
      customerCount: customerCount,
      loanHealth: loanHealth,
      availableLimit: availableLimit,
      approvedLoans: formattedApprovedLoans,
      pendingLoans: formattedPendingLoans
    });
    
  } catch (error) {
    console.error('Error in admin dashboard endpoint:', error);
    res.status(500).json({
      error: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
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

// Start server
const PORT = 3300;
app.listen(PORT, () => {
  console.log(`Database-connected admin API server running on port ${PORT}`);
});
