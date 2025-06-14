const pool = require('./config/database');

async function fixPendingLoans() {
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Get all pending loans
    const loansResult = await client.query(`
      SELECT l.id, lt.name 
      FROM loans l
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'pending'
    `);
    
    console.log(`Found ${loansResult.rows.length} pending loans to fix.`);
    
    // Update each pending loan with a readable name in the console
    for (const loan of loansResult.rows) {
      console.log(`Loan ID ${loan.id} has type: ${loan.name}`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Pending loans checked successfully.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error checking pending loans:', error);
    throw error;
  } finally {
    client.release();
  }
}

fixPendingLoans()
  .then(() => {
    console.log('Finished checking pending loans.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed checking pending loans:', error);
    process.exit(1);
  });
