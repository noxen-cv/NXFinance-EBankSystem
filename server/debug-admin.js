/**
 * Debug script to verify admin credentials in the database
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/database');
require('dotenv').config();

async function verifyAdminCredentials() {
    console.log('Running admin credentials verification...');
    const adminEmail = 'admin@nxfinance.com';  // The admin email to check
    let client;
    
    try {
        client = await pool.connect();
        
        // Check if the admin user exists
        console.log(`Checking if admin with email "${adminEmail}" exists...`);
        const userResult = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        
        if (userResult.rowCount === 0) {
            console.log(`❌ ERROR: No user found with email "${adminEmail}"`);
            
            // Create admin user if not exists
            await createAdminUser(client);
            return;
        }
        
        const user = userResult.rows[0];
        
        console.log('✓ User found!');
        console.log('User details:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Username:', user.username);
        console.log('  Role:', user.role);
        
        // Verify password "admin123"
        const testPassword = 'admin123';
        const isPasswordMatch = await bcrypt.compare(testPassword, user.password);
        
        console.log(`Password "${testPassword}" is ${isPasswordMatch ? 'CORRECT ✓' : 'INCORRECT ❌'}`);
        
        if (!isPasswordMatch) {
            console.log('Updating admin password to "admin123"...');
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
            console.log('✓ Password updated successfully');
        }
        
        // Check if user has admin role
        if (user.role !== 'admin') {
            console.log('❌ ERROR: User does not have admin role!');
            console.log('Updating role to admin...');
            await client.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
            console.log('✓ Role updated to admin');
        }
        
        // Check admin details in admins table
        console.log('Checking admin details in admins table...');
        const adminResult = await client.query('SELECT * FROM admins WHERE user_id = $1', [user.id]);
        
        if (adminResult.rowCount === 0) {
            console.log('❌ ERROR: No admin profile found for this user!');
            console.log('Creating admin profile...');
            
            await client.query(
                'INSERT INTO admins (user_id, email, first_name, last_name, department, access_level) VALUES ($1, $2, $3, $4, $5, $6)',
                [user.id, adminEmail, 'Admin', 'User', 'Management', 'full']
            );
            
            console.log('✓ Admin profile created successfully');
        } else {
            const admin = adminResult.rows[0];
            console.log('✓ Admin profile found!');
            console.log('Admin details:');
            console.log('  ID:', admin.id);
            console.log('  Email:', admin.email);
            console.log('  Name:', admin.first_name, admin.last_name);
            console.log('  Department:', admin.department);
            console.log('  Access Level:', admin.access_level);
            
            // Make sure admin email matches
            if (admin.email !== adminEmail) {
                console.log(`❌ ERROR: Admin email mismatch! (${admin.email} vs ${adminEmail})`);
                console.log('Updating admin email...');
                await client.query('UPDATE admins SET email = $1 WHERE id = $2', [adminEmail, admin.id]);
                console.log('✓ Admin email updated successfully');
            }
        }
        
        console.log('✓ Admin credentials verification completed successfully!');
        
    } catch (error) {
        console.error('ERROR during admin verification:', error);
    } finally {
        if (client) {
            client.release();
        }
    }
}

async function createAdminUser(client) {
    console.log('Creating new admin user...');
    const adminEmail = 'admin@nxfinance.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // Create user
        const userResult = await client.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [adminUsername, adminEmail, hashedPassword, 'admin']
        );
        
        const user = userResult.rows[0];
        console.log('✓ Admin user created successfully with ID:', user.id);
        
        // Create admin profile
        await client.query(
            'INSERT INTO admins (user_id, email, first_name, last_name, department, access_level) VALUES ($1, $2, $3, $4, $5, $6)',
            [user.id, adminEmail, 'Admin', 'User', 'Management', 'full']
        );
        
        console.log('✓ Admin profile created successfully');
        
    } catch (error) {
        console.error('ERROR creating admin user:', error);
    }
}

// Run the verification
verifyAdminCredentials()
    .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
    .catch(err => {
        console.error('Script failed:', err);
        process.exit(1);
    });
