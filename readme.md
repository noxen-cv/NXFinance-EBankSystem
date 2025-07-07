# NX Finance E-Banking System

NX Finance is a comprehensive prototype e-banking system featuring both customer and administrative interfaces. This full-stack web application simulates real banking functionalities including account management, loan processing, transaction tracking, and credit card management.

## 🌟 Features

### Customer Features
- ✅ User registration and authentication (email-based)
- ✅ Secure login with JWT tokens
- ✅ Personal dashboard with account overview
- ✅ Account balance viewing
- ✅ Transaction history
- ✅ Profile management
- 🛠️ Fund transfers (In Development)

### Admin Features
- ✅ Admin authentication and dashboard
- ✅ Customer database management
- ✅ Loan application processing
- ✅ System analytics and metrics
- ✅ Loan history tracking
- ✅ Client count monitoring

### Backend Features
- ✅ Normalized PostgreSQL database (8 main entities)
- ✅ RESTful API with Express.js
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Database migrations and seeding

## 🚀 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Security**: CORS, Express Rate Limiting
- **Development**: Nodemon for hot reloading

## 📂 Project Structure

```
NXFinance-EBankSystem/
│
├── public/                 # Frontend files
│   ├── index.html         # Landing page
│   ├── login.html         # Customer login
│   ├── register.html      # Customer registration
│   ├── admin.html         # Admin dashboard
│   ├── adminlogin.html    # Admin login
│   ├── clientSide/        # Customer interface
│   ├── adminSide/         # Admin interface
│   ├── Assets/            # Images and logos
│   └── js/                # Shared JavaScript utilities
│
├── server/                 # Backend application
│   ├── server.js          # Main server file
│   ├── config/            # Database and migration configs
│   ├── middleware/        # Express middlewares
│   ├── models/            # Database models
│   └── routes/            # API routes
│
├── doc/                   # Documentation
│   ├── database-schema-documentation.md
│   ├── technical-implementation.md
│   ├── project_status.md
│   └── database/          # ERD and database docs
│
└── src/                   # Additional source files
```

## 🗄️ Database Schema

The system uses a normalized PostgreSQL database with 8 main entities:
- **users** - Authentication and authorization
- **customers** - Customer profile information
- **admins** - Administrator information
- **accounts** - Bank account management
- **transactions** - Transaction history
- **loans** - Loan applications and management
- **loan_types** - Loan product categories
- **credit_cards** - Credit card management

## ⚠️ Disclaimer

This is a **prototype/educational project** designed for learning and demonstration purposes. It is **NOT production-ready** and should never be used for actual banking or financial transactions.

## 📌 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/noxen-cv/NXFinance-EBankSystem.git
   cd NXFinance-EBankSystem
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database:**
   - Install PostgreSQL
   - Create a new database named `nxfinance`
   - Update database configuration in `server/config/database.js`

4. **Configure environment variables:**
   ```bash
   # Create .env file in root directory
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nxfinance
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

7. **Start the server:**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

8. **Access the application:**
   - Customer Interface: `http://localhost:3000`
   - Admin Interface: `http://localhost:3000/admin.html`

## 🎯 Usage

### For Customers:
1. Register a new account at `/register.html`
2. Login with your email and password
3. Access your dashboard to view accounts and transactions
4. Manage your profile and view transaction history

### For Administrators:
1. Access admin login at `/adminlogin.html`
2. Use admin credentials to access the admin dashboard
3. View system metrics, customer data, and loan management
4. Process loan applications and manage customer accounts

## 📊 Key Features in Detail

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access**: Separate interfaces for customers and administrators
- **Database Integrity**: Normalized database design with proper relationships
- **Transaction Tracking**: Complete audit trail for all banking operations
- **Loan Management**: Comprehensive loan application and approval system
- **Admin Analytics**: Real-time metrics and customer insights

## 🛠️ Development Status

See `doc/project_status.md` for detailed development progress and implementation status.

## 📚 Documentation

- **Database Schema**: `doc/database-schema-documentation.md`
- **Technical Implementation**: `doc/technical-implementation.md`
- **Project Status**: `doc/project_status.md`
- **ERD Diagrams**: `doc/database/`

## 🤝 Contributing

This is an educational project. Contributions for learning purposes are welcome! Please read the documentation in the `doc/` folder to understand the system architecture.

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

---

**Note**: This project is for educational and demonstration purposes only. Do not use in production environments or for actual financial transactions.
