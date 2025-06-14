/**
 * Logout functionality for NX Finance
 * This script provides a function to log users out and redirect them to the login page.
 */

function logout() {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
      // Redirect to login page with message
    sessionStorage.setItem('authError', 'You have been logged out successfully.');
    window.location.href = '../login.html';
}

// Export the logout function for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logout };
}
