# NX Finance E-Banking System - Backend Development Documentation

## Overview
This document outlines the backend development plan for the NX Finance E-Banking System. The backend is built using Node.js, Express, and PostgreSQL, providing API endpoints for both customer and admin interfaces.

## Database Schema (3NF)

### Users Table
- `id` (PK) - Serial
- `username` - Unique identifier for login
- `password` - Bcrypt-hashed password
- `email` - User's email address
- `role` - Either 'customer' or 'admin'
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Customers Table
- `id` (PK) - Serial
- `user_id` (FK) - References Users table
- `first_name` - Customer's first name
- `last_name` - Customer's last name
- `date_of_birth` - Date
- `address` - Physical address
- `phone_number` - Contact number
- `profile_picture` - Path to profile image
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Admins Table
- `id` (PK) - Serial
- `user_id` (FK) - References Users table
- `first_name` - Admin's first name
- `last_name` - Admin's last name
- `department` - Admin's department
- `access_level` - Permission level
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Accounts Table
- `id` (PK) - Serial
- `customer_id` (FK) - References Customers table
- `account_number` - Unique account number
- `account_type` - Type of account (savings, checking)
- `balance` - Current balance
- `is_active` - Boolean status
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Card_Types Table
- `id` (PK) - Serial
- `name` - Card type name
- `description` - Details about the card
- `credit_limit` - Default credit limit
- `interest_rate` - Interest rate
- `annual_fee` - Annual fee amount
- `benefits` - Card benefits
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Cards Table
- `id` (PK) - Serial
- `customer_id` (FK) - References Customers table
- `card_type_id` (FK) - References Card_Types table
- `card_number` - Masked card number
- `expiry_date` - Card expiration date
- `cvv` - Encrypted CVV
- `is_active` - Boolean status
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Loan_Types Table
- `id` (PK) - Serial
- `name` - Type of loan
- `description` - Loan details
- `interest_rate` - Base interest rate
- `min_amount` - Minimum loan amount
- `max_amount` - Maximum loan amount
- `min_term` - Minimum term in months
- `max_term` - Maximum term in months
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Loans Table
- `id` (PK) - Serial
- `customer_id` (FK) - References Customers table
- `loan_type_id` (FK) - References Loan_Types table
- `amount` - Loan amount
- `interest_rate` - Applied interest rate
- `term_months` - Loan term
- `start_date` - Start date
- `end_date` - End date
- `status` - Current status
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Loan_Payments Table
- `id` (PK) - Serial
- `loan_id` (FK) - References Loans table
- `payment_date` - Date of payment
- `amount` - Payment amount
- `status` - Payment status
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Transactions Table
- `id` (PK) - Serial
- `account_id` (FK) - References Accounts table
- `transaction_type` - Type of transaction
- `amount` - Transaction amount
- `description` - Transaction description
- `reference_number` - Reference ID
- `status` - Transaction status
- `transaction_date` - Date of transaction
- `created_at` - Timestamp
- `updated_at` - Timestamp

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- POST `/api/auth/logout` - User logout

### Customer Endpoints
- GET `/api/customers/profile` - Get customer profile
- PUT `/api/customers/profile` - Update customer profile
- GET `/api/customers/accounts` - List customer accounts
- GET `/api/customers/cards` - List customer cards
- GET `/api/customers/loans` - List customer loans

### Account Endpoints
- GET `/api/accounts/:id` - Get account details
- GET `/api/accounts/:id/transactions` - Get account transactions
- POST `/api/accounts/transfer` - Transfer between accounts

### Card Endpoints
- GET `/api/cards/:id` - Get card details
- PUT `/api/cards/:id/activate` - Activate card
- PUT `/api/cards/:id/deactivate` - Deactivate card

### Loan Endpoints
- GET `/api/loans/types` - Get available loan types
- POST `/api/loans/apply` - Apply for a loan
- GET `/api/loans/:id/payments` - Get loan payment schedule
- POST `/api/loans/:id/payments` - Make a loan payment

### Admin Endpoints
- GET `/api/admin/customers` - List all customers
- GET `/api/admin/customers/:id` - View specific customer
- GET `/api/admin/loans/pending` - View pending loan applications
- PUT `/api/admin/loans/:id/approve` - Approve loan
- PUT `/api/admin/loans/:id/reject` - Reject loan
- GET `/api/admin/stats` - Dashboard statistics

## Middleware

### Authentication Middleware
- Verifies JWT tokens
- Extracts user information
- Validates token expiration

### Role Middleware
- Checks user roles
- Restricts access based on permissions
- Supports admin and customer roles

### Validation Middleware
- Validates request body
- Ensures required fields are present
- Validates data formats

## Files to Create/Modify

### Model Files
- Update `server/models/user.js`
- Create `server/models/customer.js`
- Create `server/models/admin.js`
- Create `server/models/account.js`
- Create `server/models/card.js`
- Create `server/models/cardType.js`
- Create `server/models/loan.js`
- Create `server/models/loanType.js`
- Create `server/models/loanPayment.js`
- Create `server/models/transaction.js`

### Route Files
- Update `server/routes/auth.js`
- Create `server/routes/customer.js`
- Create `server/routes/admin.js`
- Create `server/routes/account.js`
- Create `server/routes/card.js`
- Create `server/routes/loan.js`
- Create `server/routes/transaction.js`

### Middleware Files
- Complete `server/middleware/auth.js`
- Create `server/middleware/validation.js`
- Create `server/middleware/roles.js`

### Configuration
- Update `server/config/database.js`
- Create `server/config/migrations.js`

### Server File
- Update `server/server.js` to include new routes

## Frontend Integration Points

### Customer Dashboard
- Connect login form to authentication API
- Link welcome message to customer profile
- Update account balances with account data
- Populate transaction history from transactions API
- Display card information from cards API
- Show loan information from loans API

### Admin Dashboard
- Connect login to admin authentication
- Populate customer list from customers API
- Show loan applications from loans API
- Enable loan approval functionality

## Security Considerations
- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Input validation
- Parameterized queries to prevent SQL injection
- HTTPS for all API requests
- Limited session duration
- Proper error handling without leaking information

## Implementation Timeline
1. Database schema creation
2. Model layer implementation
3. Authentication system
4. Customer API endpoints
5. Admin API endpoints
6. Frontend integration
7. Testing and security review

## Technologies Used
- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT)
- bcrypt for password hashing
- CORS for cross-origin requests


# Logs
    ```bash
    - Authentication & Session Management:
            When a user logs in, they'll receive a JWT (JSON Web Token)
            This token contains their user ID and role (customer or admin)
            The token will be stored client-side (localStorage/sessionStorage)

    Data Population in Client Side:
            Each API endpoint will use the token to identify the logged-in user
            The client dashboard will make API calls to fetch personalized data
            For example, /api/accounts/my will return only the logged-in customer's accounts
            Data returned will include:
                Customer profile information
                Account balances and details
                Transaction history
                Cards information
                Loan information

    How the Frontend Will Connect:
            The dashboard.js in clientSide will use fetch/axios to call these endpoints
            It will include the auth token in the Authorization header
            The retrieved data will populate:
                Welcome message with user's name
                Account balances in the cards/widgets
                Transaction history in the transactions section
                Card details in the card section
                Loan information in the loans section

    Specific Frontend Integration Points:
            welcomeMessage element will display the customer's name
            Account cards will show actual balance data
            Transaction history will show real transactions
            All placeholder data will be replaced with database-driven content

    Security Considerations:
            API endpoints will verify the token before sending any data
            Customers will only see their own data
            Admin users will have access to additional endpoints with broader data views


    This approach ensures that the currently empty/placeholder data in the client dashboard will be properly populated based on the authenticated user's information from the database.