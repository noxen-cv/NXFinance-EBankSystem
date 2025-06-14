const pool = require('./config/database');

async function clearAndSeedData() {
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');    // Clear existing loans first (due to foreign key constraints)
    console.log('Clearing existing loans...');
    await client.query('DELETE FROM loans');

    // Then clear loan_types
    console.log('Clearing existing loan_types...');
    await client.query('DELETE FROM loan_types');

    // Commit transaction
    await client.query('COMMIT');
    console.log('Database cleared successfully.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error clearing data:', error);
    throw error;
  } finally {
    client.release();
  }
}

clearAndSeedData()
  .then(() => {
    console.log('Ready to seed new data.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
