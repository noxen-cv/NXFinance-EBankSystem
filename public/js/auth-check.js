/**
 * Authentication Check Script
 * This script checks if the user is authenticated before allowing access to protected pages.
 * It should be included in all protected pages (admin and client dashboards).
 */

(function() {    // Function to check if user is authenticated
    function checkAuthentication() {
        const token = localStorage.getItem('authToken'); // Updated to match adminlogin.html
        const user = localStorage.getItem('user');
        
        // If no token or user data exists, redirect to login
        if (!token || !user) {
            redirectToLogin();
            return false;
        }
        
        try {            // Parse user data
            const userData = JSON.parse(user);
            
            // Only allow admin users - this is now an admin-only system
            if (userData.role !== 'admin') {
                redirectToLogin('Administrator privileges required. Only admin users can access this system.');
                return false;
            }
            
            // Admin is authenticated and authorized
            return true;
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            redirectToLogin();
            return false;
        }
    }
    
    // Function to redirect to login page
    function redirectToLogin(message) {
        // Store the message to display on login page if provided
        if (message) {
            sessionStorage.setItem('authError', message);
        }          // Redirect to admin login page
        window.location.href = '../adminlogin.html';
    }
    
    // Check authentication when page loads
    document.addEventListener('DOMContentLoaded', function() {
        if (!checkAuthentication()) {
            // This will prevent the page from fully loading if not authenticated
            document.body.style.display = 'none';
        }
    });
    
    // Check authentication immediately (before DOM is fully loaded)
    if (!checkAuthentication()) {
        document.body.style.display = 'none';
    }
})();
