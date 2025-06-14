/**
 * Database migrations to initialize all tables
 */
const pool = require('./database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Function to run SQL file
const executeSqlFile = async (filePath) => {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        console.log(`Successfully executed SQL file: ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        console.error(`Error executing SQL file ${path.basename(filePath)}:`, error);
        return false;
    }
};

// Create all tables
const createTables = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role VARCHAR(20) DEFAULT 'customer',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
          // Create customers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                date_of_birth DATE,
                address TEXT,
                phone_number VARCHAR(20),
                profile_picture VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add unique constraint to customers.user_id if table exists but constraint doesn't
        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers'
                ) AND NOT EXISTS (
                    SELECT FROM pg_constraint WHERE conname = 'customers_user_id_key'
                ) THEN
                    ALTER TABLE customers ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);
                END IF;
            END
            $$;
        `);
        
        // Create admins table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                department VARCHAR(50),
                access_level VARCHAR(20) DEFAULT 'standard',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add unique constraint to admins.user_id if table exists but constraint doesn't
        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins'
                ) AND NOT EXISTS (
                    SELECT FROM pg_constraint WHERE conname = 'admins_user_id_key'
                ) THEN
                    ALTER TABLE admins ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);
                END IF;
            END
            $$;
        `);
        
        // Create accounts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                account_number VARCHAR(20) UNIQUE NOT NULL,
                account_type VARCHAR(20) NOT NULL,
                balance DECIMAL(15, 2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create card_types table
        await client.query(`
            CREATE TABLE IF NOT EXISTS card_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                credit_limit DECIMAL(15, 2),
                interest_rate DECIMAL(5, 2),
                annual_fee DECIMAL(10, 2),
                benefits TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create cards table
        await client.query(`
            CREATE TABLE IF NOT EXISTS cards (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                card_type_id INTEGER NOT NULL REFERENCES card_types(id),
                card_number VARCHAR(30) NOT NULL,
                expiry_date DATE NOT NULL,
                cvv VARCHAR(10) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create loan_types table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loan_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                interest_rate DECIMAL(5, 2) NOT NULL,
                min_amount DECIMAL(15, 2) NOT NULL,
                max_amount DECIMAL(15, 2) NOT NULL,
                min_term INTEGER NOT NULL,
                max_term INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create loans table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loans (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                loan_type_id INTEGER NOT NULL REFERENCES loan_types(id),
                amount DECIMAL(15, 2) NOT NULL,
                interest_rate DECIMAL(5, 2) NOT NULL,
                term_months INTEGER NOT NULL,
                start_date DATE,
                end_date DATE,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create loan_payments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loan_payments (
                id SERIAL PRIMARY KEY,
                loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
                payment_date DATE NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create transactions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                transaction_type VARCHAR(20) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                description TEXT,
                reference_number VARCHAR(50),
                status VARCHAR(20) DEFAULT 'completed',
                transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query('COMMIT');
        console.log('All tables created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Insert default data for testing
const insertDefaultData = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Create default admin user if not exists
        const adminPassword = await bcrypt.hash('admin123', 10);
        await client.query(`
            INSERT INTO users (username, password, email, role)
            VALUES ('admin', $1, 'admin@nxfinance.com', 'admin')
            ON CONFLICT (username) DO NOTHING
        `, [adminPassword]);
        
        // Get the admin user ID
        const adminResult = await client.query(`
            SELECT id FROM users WHERE username = 'admin'
        `);
        
        if (adminResult.rows.length > 0) {
            const adminUserId = adminResult.rows[0].id;
            
            // Create admin profile if not exists
            await client.query(`
                INSERT INTO admins (user_id, first_name, last_name, department, access_level)
                VALUES ($1, 'System', 'Administrator', 'IT', 'super_admin')
                ON CONFLICT (user_id) DO NOTHING
            `, [adminUserId]);
        }
        
        // Create default customer user if not exists
        const customerPassword = await bcrypt.hash('customer123', 10);
        await client.query(`
            INSERT INTO users (username, password, email, role)
            VALUES ('customer', $1, 'customer@example.com', 'customer')
            ON CONFLICT (username) DO NOTHING
        `, [customerPassword]);
        
        // Get the customer user ID
        const customerResult = await client.query(`
            SELECT id FROM users WHERE username = 'customer'
        `);
        
        if (customerResult.rows.length > 0) {
            const customerUserId = customerResult.rows[0].id;
            
            // Create customer profile if not exists
            await client.query(`
                INSERT INTO customers (user_id, first_name, last_name, date_of_birth, address, phone_number)
                VALUES ($1, 'John', 'Doe', '1990-01-01', '123 Main St, City', '+1234567890')
                ON CONFLICT (user_id) DO NOTHING
                RETURNING id
            `, [customerUserId]);
            
            // Get the customer ID
            const customerProfileResult = await client.query(`
                SELECT id FROM customers WHERE user_id = $1
            `, [customerUserId]);
            
            if (customerProfileResult.rows.length > 0) {
                const customerId = customerProfileResult.rows[0].id;
                
                // Create account for customer if not exists
                const accountNumber = `10000${customerId}`;
                await client.query(`
                    INSERT INTO accounts (customer_id, account_number, account_type, balance)
                    VALUES 
                    ($1, $2, 'Savings', 5000.00),
                    ($1, $3, 'Checking', 2500.00)
                    ON CONFLICT (account_number) DO NOTHING
                `, [customerId, accountNumber, `20000${customerId}`]);
                
                // Insert default card types if not exist
                await client.query(`
                    INSERT INTO card_types (name, description, credit_limit, interest_rate, annual_fee, benefits)
                    VALUES 
                    ('NX Standard', 'Basic credit card with low annual fee', 5000.00, 18.99, 25.00, 'No rewards'),
                    ('NX Gold', 'Premium card with rewards', 10000.00, 15.99, 75.00, '1% cashback on all purchases'),
                    ('NX Platinum', 'Elite card with extensive benefits', 20000.00, 12.99, 195.00, '2% cashback, airport lounge access')
                    ON CONFLICT DO NOTHING
                `);
                
                // Get card type IDs
                const cardTypeResult = await client.query(`
                    SELECT id FROM card_types WHERE name = 'NX Standard'
                `);
                
                if (cardTypeResult.rows.length > 0) {
                    const cardTypeId = cardTypeResult.rows[0].id;
                    
                    // Create card for customer if not exists
                    const cardNumber = `4111111111111111`;
                    const expiryDate = new Date();
                    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
                    
                    await client.query(`
                        INSERT INTO cards (customer_id, card_type_id, card_number, expiry_date, cvv, is_active)
                        VALUES ($1, $2, $3, $4, '123', true)
                        ON CONFLICT DO NOTHING
                    `, [customerId, cardTypeId, cardNumber, expiryDate]);
                }
                
                // Insert default loan types if not exist
                await client.query(`
                    INSERT INTO loan_types (name, description, interest_rate, min_amount, max_amount, min_term, max_term)
                    VALUES 
                    ('Personal Loan', 'General purpose unsecured loan', 9.99, 1000.00, 25000.00, 12, 60),
                    ('Auto Loan', 'Vehicle financing', 5.99, 5000.00, 50000.00, 24, 72),
                    ('Home Loan', 'Mortgage for property purchase', 3.99, 50000.00, 500000.00, 60, 360)
                    ON CONFLICT DO NOTHING
                `);
                
                // Get loan type ID
                const loanTypeResult = await client.query(`
                    SELECT id FROM loan_types WHERE name = 'Personal Loan'
                `);
                
                if (loanTypeResult.rows.length > 0) {
                    const loanTypeId = loanTypeResult.rows[0].id;
                    
                    // Create sample loan for customer
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setFullYear(startDate.getFullYear() + 2);
                    
                    await client.query(`
                        INSERT INTO loans (customer_id, loan_type_id, amount, interest_rate, term_months, start_date, end_date, status)
                        VALUES ($1, $2, 10000.00, 9.99, 24, $3, $4, 'approved')
                        ON CONFLICT DO NOTHING
                    `, [customerId, loanTypeId, startDate, endDate]);
                    
                    // Get account IDs for customer
                    const accountResult = await client.query(`
                        SELECT id FROM accounts WHERE customer_id = $1 LIMIT 1
                    `, [customerId]);
                    
                    if (accountResult.rows.length > 0) {
                        const accountId = accountResult.rows[0].id;
                        
                        // Create sample transactions
                        const lastMonth = new Date();
                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                        
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        
                        await client.query(`
                            INSERT INTO transactions 
                            (account_id, transaction_type, amount, description, reference_number, status, transaction_date)
                            VALUES 
                            ($1, 'deposit', 1000.00, 'Salary Deposit', 'DEP12345', 'completed', $2),
                            ($1, 'withdrawal', 200.00, 'ATM Withdrawal', 'WIT12345', 'completed', $3),
                            ($1, 'payment', 50.00, 'Utility Bill Payment', 'PAY12345', 'completed', $4)
                            ON CONFLICT DO NOTHING
                        `, [accountId, lastMonth, yesterday, new Date()]);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        console.log('Default data inserted successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error inserting default data:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Initialize database
const initializeDatabase = async () => {
    try {
        await createTables();
        await insertDefaultData();
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
};

// Run all migrations (exposed for use in server.js)
const runMigrations = async () => {
    console.log('Running database migrations...');
    try {
        const result = await initializeDatabase();
        if (result) {
            console.log('Migrations completed successfully');
            return true;
        } else {
            console.error('Migrations failed');
            return false;
        }
    } catch (error) {
        console.error('Error running migrations:', error);
        throw error;
    }
};

module.exports = {
    initializeDatabase,
    runMigrations
};
