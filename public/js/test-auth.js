// Simple admin login for testing purposes
// This script will set authentication tokens in localStorage

(function() {
    // Simulate admin login by setting tokens
    function setTestAdminTokens() {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY0OTkwMjQ3OSwiZXhwIjoxOTQ5OTg4ODc5fQ.test-token-for-development';
        const mockUser = {
            id: 1,
            username: 'admin',
            role: 'admin'
        };

        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        console.log('Test admin tokens set successfully');
        console.log('Token:', mockToken);
        console.log('User:', mockUser);
    }    // Auto-set tokens when the page loads if they don't exist
    document.addEventListener('DOMContentLoaded', function() {
        const existingToken = localStorage.getItem('token');
        if (!existingToken) {
            console.log('No existing token found, setting test tokens...');
            setTestAdminTokens();
            
            // Don't reload automatically - let the page load naturally
            console.log('Test tokens set, customer database should load now');
        } else {
            console.log('Existing token found:', existingToken.substring(0, 20) + '...');
        }
    });

    // Expose function globally for manual testing
    window.setTestAdminTokens = setTestAdminTokens;
})();
