const pool = require('./config/database');

async function checkLoanData() {
  const client = await pool.connect();
  try {
    // Check loans table structure
    console.log('CHECKING LOANS TABLE STRUCTURE:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'loans'
    `);
    
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Check for existing loans
    console.log('\nCHECKING APPROVED LOANS:');
    const approvedLoansResult = await client.query(`
      SELECT l.id, l.amount, l.status, c.first_name, c.last_name, lt.name as loan_type
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'approved'
    `);
    
    console.log(`Found ${approvedLoansResult.rows.length} approved loans:`);
    approvedLoansResult.rows.forEach(loan => {
      console.log(`- Loan #${loan.id}: ${loan.first_name} ${loan.last_name}, ${loan.loan_type}, ₱${loan.amount}, ${loan.status}`);
    });
    
    console.log('\nCHECKING PENDING LOANS:');
    const pendingLoansResult = await client.query(`
      SELECT l.id, l.amount, l.status, c.first_name, c.last_name, lt.name as loan_type
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'pending'
    `);
    
    console.log(`Found ${pendingLoansResult.rows.length} pending loans:`);
    pendingLoansResult.rows.forEach(loan => {
      console.log(`- Loan #${loan.id}: ${loan.first_name} ${loan.last_name}, ${loan.loan_type}, ₱${loan.amount}, ${loan.status}`);
    });
    
  } catch (error) {
    console.error('Error checking loan data:', error);
  } finally {
    client.release();
  }
}

checkLoanData()
  .then(() => console.log('\nDone checking loan data.'))
  .catch(err => console.error(err))
  .finally(() => process.exit());
