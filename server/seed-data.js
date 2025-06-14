/**
 * Sample Data Generator for NXFinance E-Banking System
 * 
 * This script creates sample customers and loans to demonstrate the admin dashboard.
 * It adds 10 customers with varying account balances and creates loans:
 * - 5 approved loans
 * - 5 pending loans
 */

const bcrypt = require('bcryptjs');
const pool = require('./config/database');
require('dotenv').config();

// Sample customer data
const customers = [
    {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        username: 'johnsmith',
        password: 'password123',
        phone_number: '09123456789',
        address: '123 Main St, Metro Manila',
        balance: 75000
    },
    {
        first_name: 'Maria',
        last_name: 'Santos',
        email: 'maria.santos@example.com',
        username: 'mariasantos',
        password: 'password123',
        phone_number: '09234567890',
        address: '456 Rizal Ave, Makati City',
        balance: 125000
    },
    {
        first_name: 'David',
        last_name: 'Lee',
        email: 'david.lee@example.com',
        username: 'davidlee',
        password: 'password123',
        phone_number: '09345678901',
        address: '789 Ayala Blvd, Cebu City',
        balance: 250000
    },
    {
        first_name: 'Sofia',
        last_name: 'Garcia',
        email: 'sofia.garcia@example.com',
        username: 'sofiagarcia',
        password: 'password123',
        phone_number: '09456789012',
        address: '321 Marcos Highway, Davao City',
        balance: 50000
    },
    {
        first_name: 'Michael',
        last_name: 'Tan',
        email: 'michael.tan@example.com',
        username: 'michaeltan',
        password: 'password123',
        phone_number: '09567890123',
        address: '555 EDSA, Quezon City',
        balance: 300000
    },
    {
        first_name: 'Anna',
        last_name: 'Reyes',
        email: 'anna.reyes@example.com',
        username: 'annareyes',
        password: 'password123',
        phone_number: '09678901234',
        address: '777 Katipunan Ave, Pasig City',
        balance: 85000
    },
    {
        first_name: 'Robert',
        last_name: 'Cruz',
        email: 'robert.cruz@example.com',
        username: 'robertcruz',
        password: 'password123',
        phone_number: '09789012345',
        address: '888 Ortigas Ave, Mandaluyong City',
        balance: 175000
    },
    {
        first_name: 'Jessica',
        last_name: 'Wong',
        email: 'jessica.wong@example.com',
        username: 'jessicawong',
        password: 'password123',
        phone_number: '09890123456',
        address: '999 Roxas Blvd, Manila City',
        balance: 220000
    },
    {
        first_name: 'Daniel',
        last_name: 'Lim',
        email: 'daniel.lim@example.com',
        username: 'daniellim',
        password: 'password123',
        phone_number: '09901234567',
        address: '111 Taft Ave, Iloilo City',
        balance: 135000
    },
    {
        first_name: 'Patricia',
        last_name: 'Mendoza',
        email: 'patricia.mendoza@example.com',
        username: 'patriciamendoza',
        password: 'password123',
        phone_number: '09012345678',
        address: '222 Aurora Blvd, Baguio City',
        balance: 95000
    }
];

// Sample loan types
const loanTypes = [
    { name: 'Personal Loan', interest_rate: 12.0, min_amount: 50000, max_amount: 500000, min_term: 6, max_term: 36 },
    { name: 'Home Loan', interest_rate: 7.5, min_amount: 500000, max_amount: 5000000, min_term: 60, max_term: 300 },
    { name: 'Car Loan', interest_rate: 9.0, min_amount: 200000, max_amount: 2000000, min_term: 12, max_term: 60 },
    { name: 'Business Loan', interest_rate: 15.0, min_amount: 100000, max_amount: 3000000, min_term: 12, max_term: 60 },
    { name: 'Education Loan', interest_rate: 6.0, min_amount: 50000, max_amount: 1000000, min_term: 12, max_term: 72 }
];

// Generate a random loan for a user
function generateLoan(userId, customerId, status, index) {
    const loanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
    
    // Create base date (current timestamp - random days)
    const daysAgo = Math.floor(Math.random() * 60) + 1; // 1 to 60 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    // Generate random loan amount within type limits
    const amount = Math.floor(
        Math.random() * (loanType.max_amount - loanType.min_amount) + loanType.min_amount
    );
    
    // Generate random term in months within type limits
    const term = Math.floor(
        Math.random() * (loanType.max_term - loanType.min_term) + loanType.min_term
    );
    
    // Calculate monthly payment (simple calculation)
    const monthlyInterest = loanType.interest_rate / 100 / 12;
    const monthlyPayment = (amount * monthlyInterest * Math.pow(1 + monthlyInterest, term)) / 
                          (Math.pow(1 + monthlyInterest, term) - 1);
    
    // Calculate total amount with interest
    const totalAmount = monthlyPayment * term;
    
    // For approved loans, set start date and end date
    let startDate = null;
    let endDate = null;
    
    if (status === 'approved') {
        startDate = new Date(createdAt);
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days after creation
        
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + term); // Term months after start date
    }
    
    // Purpose based on loan type
    const purposes = {
        'Personal Loan': ['Emergency Expenses', 'Debt Consolidation', 'Medical Bills', 'Home Renovation'],
        'Home Loan': ['Home Purchase', 'Home Construction', 'Home Renovation', 'Refinancing'],
        'Car Loan': ['New Car Purchase', 'Used Car Purchase', 'Vehicle Refinancing'],
        'Business Loan': ['Working Capital', 'Business Expansion', 'Equipment Purchase', 'Inventory Financing'],
        'Education Loan': ['Tuition Fees', 'Educational Materials', 'Living Expenses', 'Study Abroad']
    };
    
    const purposeOptions = purposes[loanType.name] || ['General Purpose'];
    const purpose = purposeOptions[Math.floor(Math.random() * purposeOptions.length)];
    
    // Return loan object
    return {
        customer_id: customerId,
        loan_type_name: loanType.name,
        amount: amount,
        interest_rate: loanType.interest_rate,
        term_months: term,
        start_date: startDate,
        end_date: endDate,
        status: status,
        created_at: createdAt,
        updated_at: new Date(),
        purpose: purpose,
        reference_number: `LOAN-${index.toString().padStart(4, '0')}`
    };
}

// Main function to insert sample data
async function insertSampleData() {
    const client = await pool.connect();
    
    try {
        // Begin transaction
        await client.query('BEGIN');
        
        console.log('Starting to insert sample data...');
        
        // Insert customers and their accounts
        const insertedCustomers = [];
        
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(customer.password, 10);
            
            // Insert user
            const userResult = await client.query(
                `INSERT INTO users (username, email, password, role) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [customer.username, customer.email, hashedPassword, 'customer']
            );
            
            const userId = userResult.rows[0].id;
            
            // Insert customer
            const customerResult = await client.query(
                `INSERT INTO customers (user_id, email, first_name, last_name, phone_number, address) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [userId, customer.email, customer.first_name, customer.last_name, customer.phone_number, customer.address]
            );
            
            const customerId = customerResult.rows[0].id;
              // Generate a random account number (10 digits)
            const accountNumber = '10' + Math.floor(10000000 + Math.random() * 90000000).toString();
            
            // Insert account for customer
            const accountResult = await client.query(
                `INSERT INTO accounts (customer_id, account_number, account_type, balance, is_active) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [customerId, accountNumber, 'Savings Account', customer.balance, true]
            );
            
            const accountId = accountResult.rows[0].id;
            
            console.log(`Created customer: ${customer.first_name} ${customer.last_name}, Account Balance: ₱${customer.balance}`);
            
            insertedCustomers.push({
                userId,
                customerId,
                accountId,
                name: `${customer.first_name} ${customer.last_name}`
            });
        }
        
        // Insert loan types if they don't exist
        for (const loanType of loanTypes) {
            const existingType = await client.query(
                'SELECT id FROM loan_types WHERE name = $1',
                [loanType.name]
            );
            
            if (existingType.rows.length === 0) {
                await client.query(
                    `INSERT INTO loan_types (name, interest_rate, min_amount, max_amount, min_term, max_term) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        loanType.name, loanType.interest_rate, 
                        loanType.min_amount, loanType.max_amount, 
                        loanType.min_term, loanType.max_term
                    ]
                );
                console.log(`Created loan type: ${loanType.name} with interest rate ${loanType.interest_rate}%`);
            }
        }
          // Insert loan types first and get their IDs
        const loanTypeIds = {};
        for (const loanType of loanTypes) {
            // Check if the loan type already exists
            const existingType = await client.query(
                'SELECT id FROM loan_types WHERE name = $1',
                [loanType.name]
            );
            
            let loanTypeId;
            if (existingType.rows.length > 0) {
                loanTypeId = existingType.rows[0].id;
            } else {
                // Insert the loan type
                const result = await client.query(
                    `INSERT INTO loan_types (name, interest_rate, min_amount, max_amount, min_term, max_term) 
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                    [
                        loanType.name, loanType.interest_rate, 
                        loanType.min_amount, loanType.max_amount, 
                        loanType.min_term, loanType.max_term
                    ]
                );
                loanTypeId = result.rows[0].id;
                console.log(`Created loan type: ${loanType.name} with interest rate ${loanType.interest_rate}%`);
            }
            
            loanTypeIds[loanType.name] = loanTypeId;
        }
        
        // Insert 5 approved loans
        console.log('\nCreating 5 approved loans...');
        for (let i = 0; i < 5; i++) {
            const customer = insertedCustomers[i];
            const loan = generateLoan(customer.userId, customer.customerId, 'approved', i + 1);
            
            // Get loan type ID
            const loanTypeId = loanTypeIds[loan.loan_type_name];
            if (!loanTypeId) {
                console.error(`Loan type ID not found for ${loan.loan_type_name}`);
                continue;
            }
            
            // Insert the loan
            const result = await client.query(
                `INSERT INTO loans (
                    customer_id, loan_type_id, amount, interest_rate, term_months, 
                    start_date, end_date, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                [
                    loan.customer_id, loanTypeId, loan.amount,
                    loan.interest_rate, loan.term_months, loan.start_date,
                    loan.end_date, loan.status, loan.created_at, loan.updated_at
                ]
            );
            
            const loanId = result.rows[0].id;
            
            console.log(`Created approved ${loan.loan_type_name} for ${customer.name}: ₱${loan.amount}, ID: ${loanId}`);
        }
        
        // Insert 5 pending loans
        console.log('\nCreating 5 pending loans...');
        for (let i = 5; i < 10; i++) {
            const customer = insertedCustomers[i];
            const loan = generateLoan(customer.userId, customer.customerId, 'pending', i + 1);
            
            // Get loan type ID
            const loanTypeId = loanTypeIds[loan.loan_type_name];
            if (!loanTypeId) {
                console.error(`Loan type ID not found for ${loan.loan_type_name}`);
                continue;
            }
            
            // Insert the loan
            const result = await client.query(
                `INSERT INTO loans (
                    customer_id, loan_type_id, amount, interest_rate, term_months, 
                    start_date, end_date, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                [
                    loan.customer_id, loanTypeId, loan.amount,
                    loan.interest_rate, loan.term_months, loan.start_date,
                    loan.end_date, loan.status, loan.created_at, loan.updated_at
                ]
            );
            
            const loanId = result.rows[0].id;
            
            console.log(`Created pending ${loan.loan_type} for ${customer.name}: ₱${loan.amount}, Reference: ${loan.reference_number}`);
        }
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('\nSample data insertion completed successfully!');
        
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Error inserting sample data:', error);
        throw error;
    } finally {
        // Release client
        client.release();
    }
}

// Execute the function
insertSampleData()
    .then(() => {
        console.log('Sample data generation completed.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Sample data generation failed:', error);
        process.exit(1);
    });
