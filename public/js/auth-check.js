/**
 * Authentication Check Script
 * This script checks if the user is authenticated before allowing access to protected pages.
 * It should be included in all protected pages (admin and client dashboards).
 */

(function() {
    // Function to check if user is authenticated
    function checkAuthentication() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        // If no token or user data exists, redirect to login
        if (!token || !user) {
            redirectToLogin();
            return false;
        }
        
        try {
            // Parse user data
            const userData = JSON.parse(user);
            
            // Check if current page matches user role
            const currentPath = window.location.pathname;
            
            // Admin path check
            if (currentPath.includes('/adminSide/') && userData.role !== 'admin') {
                redirectToLogin('You do not have permission to access the admin area.');
                return false;
            }
            
            // Client path check
            if (currentPath.includes('/clientSide/') && userData.role !== 'customer') {
                redirectToLogin('You do not have permission to access this area.');
                return false;
            }
            
            // User is authenticated and authorized
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
        }
        
        // Redirect to login page
        window.location.href = '/login.html';
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
