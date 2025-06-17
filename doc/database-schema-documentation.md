# NX Finance E-Banking System - Database Schema Documentation

## Entity Relationship Diagram (ERD)

The NX Finance E-Banking System database consists of 8 main entities with clear relationships designed to support a comprehensive banking application.

### Tables Overview

#### 1. **users** (Authentication & Authorization)
- **Purpose**: Central authentication table for all system users
- **Key Fields**: 
  - `id` (Primary Key)
  - `email` (Unique identifier for login)
  - `password` (Hashed password)
  - `role` (Determines user type: 'customer', 'admin')
- **Color Code**: Purple (#e1d5e7)

#### 2. **customers** (Customer Information)
- **Purpose**: Stores detailed customer profile information
- **Key Fields**:
  - `id` (Primary Key)
  - `user_id` (Foreign Key to users)
  - `first_name`, `last_name`, `email`, `phone`, `address`
  - `date_of_birth`
- **Relationships**: 1:1 with users, 1:M with accounts, loans, credit_cards
- **Color Code**: Blue (#dae8fc)

#### 3. **admins** (Administrator Information)
- **Purpose**: Stores administrator profile information
- **Key Fields**:
  - `id` (Primary Key)
  - `user_id` (Foreign Key to users)
  - `first_name`, `last_name`, `email`
- **Relationships**: 1:1 with users
- **Color Code**: Red (#f8cecc)

#### 4. **accounts** (Bank Accounts)
- **Purpose**: Manages customer bank accounts
- **Key Fields**:
  - `id` (Primary Key)
  - `customer_id` (Foreign Key to customers)
  - `account_number` (Unique account identifier)
  - `account_type` (Savings, Checking, etc.)
  - `balance` (Current account balance)
  - `status` (Active, Suspended, Closed)
- **Relationships**: M:1 with customers, 1:M with transactions
- **Color Code**: Yellow (#fff2cc)

#### 5. **loan_types** (Loan Categories)
- **Purpose**: Defines available loan products
- **Key Fields**:
  - `id` (Primary Key)
  - `name` (Home Loan, Car Loan, Personal Loan, etc.)
  - `interest_rate` (Default interest rate)
  - `description` (Loan details)
- **Relationships**: 1:M with loans
- **Color Code**: Green (#d5e8d4)

#### 6. **loans** (Loan Applications & Records)
- **Purpose**: Manages loan applications and active loans
- **Key Fields**:
  - `id` (Primary Key)
  - `customer_id` (Foreign Key to customers)
  - `loan_type_id` (Foreign Key to loan_types)
  - `amount` (Loan amount)
  - `interest_rate`, `term_months`
  - `status` (Pending, Approved, Rejected, Active, Closed)
  - `purpose` (Reason for loan)
  - `application_date`, `approval_date`
- **Relationships**: M:1 with customers, M:1 with loan_types
- **Color Code**: Orange (#fad7ac)

#### 7. **transactions** (Transaction History)
- **Purpose**: Records all account transactions
- **Key Fields**:
  - `id` (Primary Key)
  - `account_id` (Foreign Key to accounts)
  - `transaction_type` (Deposit, Withdrawal, Transfer, etc.)
  - `amount` (Transaction amount)
  - `description` (Transaction details)
  - `balance_before`, `balance_after` (Account balance tracking)
  - `status` (Pending, Completed, Failed)
- **Relationships**: M:1 with accounts
- **Color Code**: Light Red (#f8cecc)

#### 8. **credit_cards** (Credit Card Management)
- **Purpose**: Manages customer credit cards
- **Key Fields**:
  - `id` (Primary Key)
  - `customer_id` (Foreign Key to customers)
  - `card_number` (Encrypted card number)
  - `card_type` (Visa, MasterCard, etc.)
  - `credit_limit`, `current_balance`
  - `status` (Active, Suspended, Expired)
- **Relationships**: M:1 with customers
- **Color Code**: Purple (#e1d5e7)

### Key Relationships

1. **Users → Customers/Admins**: 1:1 relationships for role-based access
2. **Customers → Accounts**: 1:M (One customer can have multiple accounts)
3. **Customers → Loans**: 1:M (One customer can have multiple loans)
4. **Customers → Credit Cards**: 1:M (One customer can have multiple cards)
5. **Accounts → Transactions**: 1:M (One account has many transactions)
6. **Loan Types → Loans**: 1:M (One loan type for many loans)

### Database Features

- **Normalized Design**: Reduces data redundancy and ensures consistency
- **Role-based Access**: Clear separation between customers and administrators
- **Audit Trail**: Timestamps on all tables for tracking changes
- **Financial Integrity**: Balance tracking in transactions table
- **Flexible Loan System**: Support for multiple loan types with different rates
- **Comprehensive Customer Management**: Full customer lifecycle support

### Usage in Admin Dashboard

The admin dashboard specifically uses:
- **customers** table for client count metrics
- **loans** table for approved/pending loan statistics
- **loan_types** table for loan categorization
- Combined queries for loan health calculations and available limits

This ERD supports the complete banking workflow from user registration through loan management, account operations, and administrative oversight.
