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
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            username: formData.get('email') // Using email as username for simplicity
        };
        
        // Call your API to register the user
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        // Parse the response
        let data;
        try {
            const text = await response.text();
            if (!text) {
                throw new Error('Server returned empty response');
            }
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error('Server returned invalid response. Please try again.');
        }

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Show success message
        errorDiv.style.backgroundColor = '#e8f5e9';
        errorDiv.style.color = '#2e7d32';
        errorDiv.textContent = 'Account created successfully! Redirecting to login...';
        errorDiv.classList.add('visible');
        
        // Redirect to login after successful registration
        setTimeout(() => {
            document.body.classList.add('fade-out');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
        }, 2000);

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
