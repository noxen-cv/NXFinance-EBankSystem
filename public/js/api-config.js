// API Configuration
// This file centralizes API configuration for the frontend

window.API_CONFIG = {
    // Base URL for the API server
    BASE_URL: 'http://localhost:3000',
    
    // API endpoints
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout'
        },
        ADMIN: {
            DASHBOARD: '/api/admin/dashboard',
            CUSTOMERS: '/api/admin/customers',
            CUSTOMER_BY_ID: '/api/admin/customers/:id'
        },
        CUSTOMER: {
            PROFILE: '/api/customer/profile',
            ACCOUNTS: '/api/customer/accounts',
            TRANSACTIONS: '/api/customer/transactions'
        }
    },
    
    // Helper function to get full API URL
    getUrl: function(endpoint) {
        return this.BASE_URL + endpoint;
    },
    
    // Helper function to get API URL with parameters
    getUrlWithParams: function(endpoint, params = {}) {
        let url = this.BASE_URL + endpoint;
        Object.keys(params).forEach(key => {
            url = url.replace(':' + key, params[key]);
        });
        return url;
    }
};

console.log('API Configuration loaded:', window.API_CONFIG);
