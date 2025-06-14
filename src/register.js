// Handle page transitions and form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Fade in the page on load
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 10);

    // Set up event listeners
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleSignup);
    }
    
    // Set up card click event
    const cardImg = document.querySelector('.card-img');
    if (cardImg) {
        cardImg.addEventListener('click', goToLogin);
    }
    
    // Set up interactive area click event
    const cardInteractiveArea = document.querySelector('.card-interactive-area');
    if (cardInteractiveArea) {
        cardInteractiveArea.addEventListener('click', goToLogin);
    }
});

// Navigate back to login page with card animation
function goToLogin(event) {
    // If the click came from the card, add a special animation
    if (event && (event.target.classList.contains('card-img') || event.currentTarget.classList.contains('card-interactive-area'))) {
        const card = document.querySelector('.card-img');
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        card.style.transform = 'scale(1.1) translateY(-20px) rotate(-15deg)';
        card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
        
        // Add a flash effect to the page
        const flash = document.createElement('div');
        flash.className = 'login-flash';
        document.body.appendChild(flash);
        
        // Reduced delay for quicker response
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 200);
    } else {
        // Standard transition for other elements like the back button
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 300);
    }
}

// Handle the signup form submission
async function handleSignup(event) {
    event.preventDefault();
    const signupButton = event.target.querySelector('.signup-btn');
    const errorDiv = document.getElementById('registerError');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Clear any existing error message
    errorDiv.textContent = '';
    errorDiv.classList.remove('visible');
    
    try {
        signupButton.classList.add('loading');
        loadingOverlay.style.display = 'flex';        
        const formData = new FormData(event.target);
        
        // Debug log to see what fields are being submitted
        console.log('Form fields:', {
            username: formData.get('username'),
            email: formData.get('email'),
            password: '(hidden)',
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            phone_number: formData.get('phone_number')
        });
        
        // Get values from form
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            date_of_birth: null,
            phone_number: formData.get('phone_number') || null,
            address: null
        };        // Call your API to register the user
        console.log('Sending registration request with data:', JSON.stringify(userData));
        
        let response;
        let endpointsToTry = [
            '/api/auth/register',
            '/api/auth/register-direct'
        ];
        let success = false;
        let lastError;
        
        // Try each endpoint until one works
        for (const endpoint of endpointsToTry) {
            if (success) break;
            
            try {
                console.log(`Trying registration endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });
                
                console.log(`${endpoint} response status:`, response.status);
                
                if (response.status !== 405) { // If not Method Not Allowed
                    success = true;
                    console.log('Successfully used endpoint:', endpoint);
                    break;
                } else {
                    console.log(`${endpoint} returned 405, will try next endpoint if available`);
                    lastError = new Error(`${endpoint} returned method not allowed`);
                }
            } catch (fetchError) {
                console.error(`Error with ${endpoint}:`, fetchError);
                lastError = fetchError;
            }
        }        
        if (!success && !response) {
            throw lastError || new Error('All registration endpoints failed');
        }// Parse the response
        let data;
        const text = await response.text();
        console.log('Raw response text:', text);
        console.log('Response length:', text ? text.length : 0);
        
        // If the response is empty, handle based on status code
        if (!text || text.trim() === '') {
            console.log('Empty response received with status code:', response.status);
            
            if (response.ok) {
                console.log('Empty but successful response, using default success data');
                data = { success: true, message: 'Registration successful! You can now log in.' };
            } else {
                // Create a more specific error message based on status code
                let errorMessage = 'Server returned empty response';
                
                if (response.status === 400) {
                    errorMessage = 'Invalid registration data. Please check your information.';
                } else if (response.status === 409) {
                    errorMessage = 'Username or email already exists.';
                } else if (response.status === 403) {
                    errorMessage = 'Registration not allowed.';
                } else {
                    errorMessage = `Server error: HTTP ${response.status}. Check network tab for details.`;
                }
                
                throw new Error(errorMessage);
            }
        }
        // Try to parse non-empty response
        else {
            try {
                data = JSON.parse(text);
                console.log('Registration response (parsed):', data);            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                
                // If status is OK but parsing failed, create a default success response
                if (response.ok) {
                    data = { 
                        success: true, 
                        message: 'Registration successful! You can now log in.',
                        note: 'Response could not be parsed but status was successful'
                    };
                    console.log('Created default success data due to parse error with OK status');
                } else {
                    throw new Error(`Server returned invalid response (HTTP ${response.status}). Please try again later.`);
                }
            }
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed. Please try again.');
        }
        
        // Show success message
        errorDiv.textContent = 'Registration successful! Redirecting to login...';
        errorDiv.style.backgroundColor = '#e8f5e9';
        errorDiv.style.color = '#2e7d32';
        errorDiv.classList.add('visible');
        
        // Redirect to login page after a brief delay
        setTimeout(() => {
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
        }, 1500);

    } catch (error) {
        // Show error message
        errorDiv.style.backgroundColor = 'rgba(229, 62, 62, 0.1)';
        errorDiv.style.color = '#e53e3e';
        errorDiv.textContent = error.message;
        errorDiv.classList.add('visible');
    } finally {
        signupButton.classList.remove('loading');
        loadingOverlay.style.display = 'none';
    }
}

// Toggle password visibility
function toggleRegisterPassword() {
    const passwordInput = document.getElementById('registerPassword');
    const toggleBtn = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁';
    }
}
