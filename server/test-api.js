const fetch = require('node-fetch');

// Test the registration API
async function testRegister() {
    const userData = {
        username: `test_${Math.random().toString(36).substring(7)}`,
        password: 'Password123!',
        email: `test_${Math.random().toString(36).substring(7)}@example.com`,
        first_name: 'Test',
        last_name: 'User',
        phone_number: '1234567890'
    };

    console.log('Testing register API with data:', userData);
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);

        try {
            const data = JSON.parse(text);
            console.log('Parsed JSON response:', data);
        } catch (e) {
            console.log('Could not parse response as JSON');
        }
    } catch (error) {
        console.error('Error testing register API:', error.message);
    }
}

testRegister();
