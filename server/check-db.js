const pool = require('./config/database');

async function checkDatabase() {
  const client = await pool.connect();
  try {
    // Check tables
    const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables in the database:');
    tablesResult.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    // Check loan_types specifically
    try {
      const loanTypesResult = await client.query("SELECT * FROM loan_types");
      console.log('\nLoan Types:');
      loanTypesResult.rows.forEach(type => console.log(`- ${type.name}: ${type.interest_rate}%`));
    } catch (e) {
      console.log('\nNo loan_types table or error accessing it:', e.message);
    }
    
    // Check loans table structure
    try {
      const loansStructure = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'loans'");
      console.log('\nLoans table structure:');
      loansStructure.rows.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
    } catch (e) {
      console.log('\nError checking loans table structure:', e.message);
    }
  } finally {
    client.release();
  }
}

checkDatabase()
  .then(() => {
    console.log('\nDatabase check completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error checking database:', err);
    process.exit(1);
  });
