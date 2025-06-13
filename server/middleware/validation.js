/**
 * Validation middleware for request data
 */

/**
 * Validates login request
 */
const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    next();
};

/**
 * Validates registration request
 */
const validateRegistration = (req, res, next) => {
    const { username, password, email, first_name, last_name } = req.body;
    
    if (!username || !password || !email || !first_name || !last_name) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Username validation
    if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
    }
    
    // Password validation
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    next();
};

/**
 * Validates transaction requests (transfer, deposit, withdrawal)
 */
const validateTransaction = (req, res, next) => {
    const { from_account_id, to_account_id, account_id, amount } = req.body;
    
    // Check if it's a transfer (requires from and to accounts)
    if (from_account_id && to_account_id) {
        if (from_account_id === to_account_id) {
            return res.status(400).json({ error: 'Cannot transfer to the same account' });
        }
    } 
    // If not a transfer, require an account_id for deposit/withdrawal
    else if (!account_id) {
        return res.status(400).json({ error: 'Account ID is required' });
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    next();
};

/**
 * Validates loan application request
 */
const validateLoanApplication = (req, res, next) => {
    const { loan_type_id, amount, term_months } = req.body;
    
    if (!loan_type_id || !amount || !term_months) {
        return res.status(400).json({ error: 'Loan type, amount, and term are required' });
    }
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    if (isNaN(term_months) || parseInt(term_months) <= 0 || !Number.isInteger(Number(term_months))) {
        return res.status(400).json({ error: 'Term must be a positive integer' });
    }
    
    next();
};

/**
 * Validates customer profile update request
 */
const validateCustomerProfile = (req, res, next) => {
    const { first_name, last_name, phone_number } = req.body;
    
    if (first_name && first_name.length < 1) {
        return res.status(400).json({ error: 'First name cannot be empty' });
    }
    
    if (last_name && last_name.length < 1) {
        return res.status(400).json({ error: 'Last name cannot be empty' });
    }
    
    if (phone_number && !/^\+?[0-9]{10,15}$/.test(phone_number)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    next();
};

/**
 * Validates account creation request
 */
const validateAccountCreation = (req, res, next) => {
    const { account_type, initial_deposit } = req.body;
    
    if (!account_type || !['savings', 'checking', 'investment'].includes(account_type.toLowerCase())) {
        return res.status(400).json({ error: 'Valid account type (savings, checking, or investment) is required' });
    }
    
    if (initial_deposit && (isNaN(initial_deposit) || parseFloat(initial_deposit) < 0)) {
        return res.status(400).json({ error: 'Initial deposit must be a non-negative number' });
    }
    
    next();
};

/**
 * Validates card request
 */
const validateCardRequest = (req, res, next) => {
    const { card_type_id, account_id } = req.body;
    
    if (!card_type_id) {
        return res.status(400).json({ error: 'Card type is required' });
    }
    
    if (account_id && isNaN(account_id)) {
        return res.status(400).json({ error: 'Invalid account ID' });
    }
    
    next();
};

/**
 * Validates admin role
 */
const validateAdminRole = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
};

module.exports = {
    validateLogin,
    validateRegistration,
    validateTransaction,
    validateLoanApplication,
    validateCustomerProfile,
    validateAccountCreation,
    validateCardRequest,
    validateAdminRole
};
