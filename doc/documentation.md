# NXFinance E-Banking System Documentation

## Overview

NXFinance is a full-stack e-banking system with a modern frontend interface and robust Node.js/Express/PostgreSQL backend. The system supports both admin and customer roles, with a normalized database structure and secure authentication mechanisms.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Authentication System](#authentication-system)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Setup & Installation](#setup--installation)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Development Notes](#development-notes)

## System Architecture

NXFinance follows a standard modern web application architecture:

- **Frontend**: HTML/CSS/JavaScript for the client-side interface
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL for relational data storage
- **Authentication**: JWT (JSON Web Token) based authentication

The system is structured into separate client and server components:

```
NXFinance-EBankSystem/
├── public/            # Static frontend files
│   ├── adminSide/     # Admin dashboard interface
│   ├── clientSide/    # Customer dashboard interface
│   ├── Assets/        # Images and other static assets
│   ├── js/            # Shared JavaScript files
│   ├── index.html     # Landing page
│   ├── login.html     # Login page
│   └── register.html  # Registration page
├── server/            # Backend server code
│   ├── config/        # Database and server configuration
│   ├── middleware/    # Express middleware
│   ├── models/        # Database models
│   ├── routes/        # API route definitions
│   └── server.js      # Main server entry point
└── src/               # Frontend source files
    ├── components/    # Reusable UI components
    └── styles/        # CSS stylesheet files
```

## Database Schema

The system uses a normalized PostgreSQL database with the following primary tables:

### Users Table
Stores authentication information for all users:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL, -- For profile display purposes only
    password VARCHAR(255) NOT NULL, -- Stores bcrypt hashed passwords
    email VARCHAR(100) UNIQUE NOT NULL, -- Primary identifier for authentication
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

### Customers Table
Stores customer-specific information:
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    address TEXT,
    phone_number VARCHAR(20),
    profile_picture VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

### Admins Table
Stores admin-specific information:
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    access_level VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
```

Additional tables exist for accounts, transactions, cards, and loans. The complete schema can be found in `server/config/migrations.js`.

## Authentication System

The system uses JWT (JSON Web Token) based authentication:

1. **Registration**:
   - Users register with email, password, and personal information
   - Passwords are hashed using bcrypt before storage
   - User accounts are created with the 'customer' role by default
   - A corresponding customer profile is created
   - Multiple registration endpoints ensure reliability (/api/auth/register and /api/auth/register-direct)

2. **Login**:
   - Users log in using email and password (email is the primary identifier, not username)
   - The system verifies credentials against the database using the findByEmailAndPassword method
   - Upon successful verification, a JWT token is issued
   - The token contains the user's ID, email, and role

3. **Authorization**:
   - Protected routes require a valid JWT token
   - Admin routes check for the 'admin' role in the token
   - Customer routes are restricted to the appropriate user
   - Token verification includes checking expiration and signature validity

## API Endpoints

### Authentication

- **POST /api/auth/register** or **POST /api/auth/register-direct**
  - Register a new user account
  - Body: `{ email, password, first_name, last_name, [username], [phone_number], [address] }`
  - Response: `{ success, message, user, token }`
  - Note: The system implements two registration endpoints for reliability

- **POST /api/auth/login**
  - Authenticate a user
  - Body: `{ email, password }` (Email is required, not username)
  - Response: `{ success, token, user }`

### Customer

- **GET /api/customers/profile**
  - Get the authenticated customer's profile
  - Authorization: Bearer Token
  - Response: Customer profile data

- **PUT /api/customers/profile**
  - Update customer profile
  - Authorization: Bearer Token
  - Body: Updated profile fields
  - Response: Updated customer data

### Admin

- **GET /api/admin/dashboard**
  - Get admin dashboard data
  - Authorization: Bearer Token (admin role)
  - Response: Dashboard statistics

- **GET /api/admin/customers**
  - List all customers
  - Authorization: Bearer Token (admin role)
  - Response: Array of customers

### Additional endpoints exist for accounts, transactions, cards, and loans.

## Frontend Components

The frontend is organized into distinct sections:

1. **Public Pages**:
   - Landing page with system information
   - Login page (email-based authentication)
   - Registration page

2. **Client Dashboard**:
   - Account overview
   - Transaction history
   - Fund transfers
   - Card management
   - Loan applications

3. **Admin Dashboard**:
   - Customer management
   - Transaction monitoring
   - Loan approval
   - System statistics

## Setup & Installation

### Prerequisites

- Node.js (v16+)
- PostgreSQL database
- XAMPP or similar web server

### Installation Steps

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd NXFinance-EBankSystem
   ```

2. **Set Up Environment**:
   - Create a `.env` file in the root directory
   - Copy contents from `.env.example`
   - Update with your database credentials and JWT secret

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Initialize Database**:
   ```bash
   npm run db:init
   # Or the database will initialize when starting the server
   ```

5. **Start the Server**:
   ```bash
   cd server
   node server.js
   ```

6. **Access the Application**:
   - Open a browser and navigate to http://localhost:3000
   - For admin access, create a user with the 'admin' role

## Common Issues & Solutions

### Registration Issues

**Issue**: "Server returned empty response" or "HTTP 405" error during registration.

**Solution**: 
- The system implements multiple registration endpoints to handle potential routing issues:
  - Primary endpoint: `/api/auth/register`
  - Fallback endpoint: `/api/auth/register-direct` (bypasses router for more reliable processing)
- Client-side code automatically attempts both endpoints if the first fails
- Extensive error handling is in place to provide meaningful feedback
- If registration appears to fail but no specific error shows, try logging in with your credentials as the account may have been created successfully
- Check browser console and server logs for detailed error information

### Login Issues

**Issue**: "Invalid username or password" even with correct credentials.

**Solution**:
- Always use email address for login, not username (the system has been updated to use email-based authentication)
- Passwords are case-sensitive and should match what was used during registration
- Check for extra spaces before or after email/password (trim whitespace)
- If recently registered, wait a moment for the database to update
- Clear browser cache or try a different browser if persistent issues occur
- Check server logs for specific authentication errors

### Database Connection

**Issue**: Server cannot connect to the database.

**Solution**:
- Verify PostgreSQL service is running.
- Check credentials in `.env` file.
- Ensure the database exists and is accessible.

## Development Notes

### Authentication Changes

- The system was updated from username-based to email-based authentication
- Login forms now require email instead of username (username is no longer used for authentication)
- All backend routes and models were updated to authenticate via email
- Registration still collects username for profile display purposes only
- Database schema maintains email in Users, Customers, and Admins tables for consistency

### API Error Handling

- Comprehensive error handling is implemented for all API endpoints
- Specific error messages and appropriate HTTP status codes are returned
- Client-side code includes fallbacks for handling various error scenarios
- Multiple registration endpoints ensure system resilience
- Detailed request/response logging aids in debugging

### Security Considerations

- All passwords are hashed using bcrypt with appropriate salt rounds
- Authentication uses JWT with configurable expiration time
- Protected routes verify token authenticity and user roles
- Input validation is performed on both client and server sides
- Database transactions ensure data consistency during registration
- Parameterized queries prevent SQL injection

### Debugging Techniques

- Check server logs for detailed error information
- Use browser developer tools to inspect network requests/responses
- The test-api.js script can be used to test API endpoints directly
- Monitor for HTTP status codes (especially 401, 403, 405) to identify common issues
- Database logs may contain additional information about constraint violations

---

*Documentation created for NXFinance E-Banking System - June 2025*
