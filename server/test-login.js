const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
    // Admin login
    await testUserLogin('admin@nxfinance.com', 'admin123', 'Admin');
    
    // Customer login
    await testUserLogin('customer@example.com', 'customer123', 'Customer');
}

async function testUserLogin(email, password, userType) {
    const userData = {
        email: email,
        password: password
    };

    console.log(`Testing ${userType} login with: ${email}`);
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        console.log(`${userType} login status:`, response.status);
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            console.log(`${userType} login response:`, {
                success: !!data.token,
                role: data.user?.role,
                token: data.token ? `${data.token.substring(0, 20)}...` : 'No token'
            });
        } catch (e) {
            console.log('Response (not JSON):', text);
        }
    } catch (error) {
        console.error(`Error testing ${userType} login:`, error.message);
    }
    console.log('-----------------------------------');
}

testLogin();
