// Customer Database JavaScript
class CustomerDatabase {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.customers = [];
        this.filteredCustomers = [];
        
        this.init();
    }    async init() {
        console.log('Initializing Customer Database...');
        
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.setupEventListeners();
        await this.loadCustomers();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchInput.addEventListener('input', () => this.filterCustomers());
        searchBtn.addEventListener('click', () => this.filterCustomers());
        
        // Filter dropdowns
        document.getElementById('statusFilter').addEventListener('change', () => this.filterCustomers());
        document.getElementById('dateFilter').addEventListener('change', () => this.filterCustomers());
        
        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
        
        // Select all checkbox
        document.getElementById('selectAllCustomers').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }    async loadCustomers() {
        try {
            console.log('Loading customers from API...');
            
            // Check if table exists
            const tableBody = document.getElementById('customerTableBody');
            if (!tableBody) {
                throw new Error('Customer table body element not found');
            }
            
            const token = localStorage.getItem('token');
            
            // Prepare headers - include token if available, but allow requests without it for development
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('Using authentication token');
            } else {
                console.log('No token found, attempting without authentication (development mode)');
            }            console.log('Fetching customer data from http://localhost:3000/api/admin/customers');
            const response = await fetch('http://localhost:3000/api/admin/customers', {
                headers: headers
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                if (response.status === 401) {
                    this.showError('Authentication required. Please log in again.');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Customer data received:', data);
            
            if (data.success && Array.isArray(data.customers)) {
                this.customers = data.customers;
                this.filteredCustomers = [...this.customers];
                this.totalPages = data.pagination?.pages || Math.ceil(this.customers.length / this.pageSize);
                
                console.log(`Processing ${this.customers.length} customers`);
                
                this.renderCustomerTable();
                this.updatePagination();
                this.updateSummaryCards();
                
                console.log(`Successfully loaded ${this.customers.length} customers`);
            } else {
                throw new Error(data.error || 'Invalid response format from server');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showError(`Failed to load customer data: ${error.message}`);
        }
    }

    filterCustomers() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        this.filteredCustomers = this.customers.filter(customer => {
            // Search filter
            const searchMatch = searchTerm === '' || 
                customer.first_name?.toLowerCase().includes(searchTerm) ||
                customer.last_name?.toLowerCase().includes(searchTerm) ||
                customer.email?.toLowerCase().includes(searchTerm) ||
                customer.phone_number?.toLowerCase().includes(searchTerm);
            
            // Status filter (for now, we'll treat all as active)
            const statusMatch = statusFilter === 'all' || statusFilter === 'active';
            
            // Date filter (simple implementation)
            const dateMatch = dateFilter === 'all' || this.matchesDateFilter(customer.created_at, dateFilter);
            
            return searchMatch && statusMatch && dateMatch;
        });
        
        this.currentPage = 1;
        this.updatePagination();
        this.renderCustomerTable();
    }

    matchesDateFilter(dateString, filter) {
        if (!dateString) return false;
        
        const customerDate = new Date(dateString);
        const now = new Date();
        
        switch (filter) {
            case 'month':
                return customerDate.getMonth() === now.getMonth() && 
                       customerDate.getFullYear() === now.getFullYear();
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                const customerQuarter = Math.floor(customerDate.getMonth() / 3);
                return customerQuarter === quarter && 
                       customerDate.getFullYear() === now.getFullYear();
            case 'year':
                return customerDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    }    renderCustomerTable() {
        console.log('Rendering customer table...');
        const tbody = document.getElementById('customerTableBody');
        
        if (!tbody) {
            console.error('Customer table body not found');
            return;
        }

        console.log(`Rendering ${this.filteredCustomers.length} filtered customers`);

        // Clear existing content
        tbody.innerHTML = '';
        
        if (this.filteredCustomers.length === 0) {
            console.log('No customers to display, showing empty state');
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div class="material-icons">people_outline</div>
                        <h3>No Customers Found</h3>
                        <p>No customers match your current filters.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageCustomers = this.filteredCustomers.slice(startIndex, endIndex);

        console.log(`Displaying customers ${startIndex + 1} to ${Math.min(endIndex, this.filteredCustomers.length)} of ${this.filteredCustomers.length}`);

        pageCustomers.forEach((customer, index) => {
            const row = this.createCustomerRow(customer);
            tbody.appendChild(row);
            if (index === 0) {
                console.log('First customer row created:', customer.first_name, customer.last_name);
            }
        });
        
        console.log(`Table rendered with ${pageCustomers.length} rows`);
    }

    createCustomerRow(customer) {
        const row = document.createElement('tr');
        
        const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A';
        const email = customer.email || 'N/A';
        const phone = customer.phone_number || 'N/A';
        const registrationDate = customer.created_at ? 
            new Date(customer.created_at).toLocaleDateString() : 'N/A';
        const status = 'Active'; // Default status
        const totalLoans = '0'; // Placeholder
        
        row.innerHTML = `
            <td><input type="checkbox" data-customer-id="${customer.id}"></td>
            <td>${customer.id}</td>
            <td>${fullName}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td>${registrationDate}</td>
            <td><span class="status-badge active">${status}</span></td>
            <td>${totalLoans}</td>
            <td>
                <button class="action-btn view" onclick="customerDatabase.viewCustomer(${customer.id})">View</button>
                <button class="action-btn edit" onclick="customerDatabase.editCustomer(${customer.id})">Edit</button>
                <button class="action-btn delete" onclick="customerDatabase.deleteCustomer(${customer.id})">Delete</button>
            </td>
        `;
        
        return row;
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredCustomers.length / this.pageSize);
        
        const pageIndicator = document.getElementById('pageIndicator');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (pageIndicator) {
            pageIndicator.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCustomerTable();
            this.updatePagination();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderCustomerTable();
            this.updatePagination();
        }
    }

    updateSummaryCards() {
        // Update summary statistics
        const totalCustomersEl = document.getElementById('totalCustomers');
        const activeAccountsEl = document.getElementById('activeAccounts');
        const newCustomersEl = document.getElementById('newCustomers');
        const verifiedCustomersEl = document.getElementById('verifiedCustomers');
        const customersWithLoansEl = document.getElementById('customersWithLoans');
        const premiumCustomersEl = document.getElementById('premiumCustomers');

        if (totalCustomersEl) {
            totalCustomersEl.textContent = this.customers.length;
        }
        
        if (activeAccountsEl) {
            activeAccountsEl.textContent = this.customers.length; // Assuming all are active
        }
        
        if (newCustomersEl) {
            // Calculate customers from this month
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            const newThisMonth = this.customers.filter(customer => {
                if (!customer.created_at) return false;
                const date = new Date(customer.created_at);
                return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
            }).length;
            newCustomersEl.textContent = newThisMonth;
        }
        
        // Placeholder percentages
        if (verifiedCustomersEl) {
            verifiedCustomersEl.textContent = '100%';
        }
        
        if (customersWithLoansEl) {
            customersWithLoansEl.textContent = '25%';
        }
        
        if (premiumCustomersEl) {
            premiumCustomersEl.textContent = '10%';
        }
    }

    // Action methods
    viewCustomer(customerId) {
        console.log('Viewing customer:', customerId);
        // Implement customer view functionality
        alert(`View customer details for ID: ${customerId}`);
    }

    editCustomer(customerId) {
        console.log('Editing customer:', customerId);
        // Implement customer edit functionality
        alert(`Edit customer for ID: ${customerId}`);
    }

    deleteCustomer(customerId) {
        console.log('Deleting customer:', customerId);
        if (confirm('Are you sure you want to delete this customer?')) {
            // Implement customer delete functionality
            alert(`Delete customer for ID: ${customerId}`);
        }
    }

    showError(message) {
        const tbody = document.getElementById('customerTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem; color: #dc2626;">
                        <div class="material-icons" style="font-size: 3rem; margin-bottom: 1rem;">error</div>
                        <p><strong>Error:</strong> ${message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Initialize the customer database when the page loads
let customerDatabase;

// Multiple initialization attempts
function initializeCustomerDatabase() {
    console.log('Attempting to initialize Customer Database...');
    
    // Check if required elements exist
    const tableBody = document.getElementById('customerTableBody');
    const totalCustomersEl = document.getElementById('totalCustomers');
    
    if (!tableBody) {
        console.log('Table body not found, retrying in 500ms...');
        setTimeout(initializeCustomerDatabase, 500);
        return;
    }
    
    if (customerDatabase) {
        console.log('Customer Database already initialized');
        return;
    }
    
    console.log('Creating Customer Database instance...');
    customerDatabase = new CustomerDatabase();
    window.customerDatabase = customerDatabase;
    console.log('Customer Database initialized successfully');
}

// Try multiple initialization methods
document.addEventListener('DOMContentLoaded', initializeCustomerDatabase);
window.addEventListener('load', initializeCustomerDatabase);

// Also try after a delay
setTimeout(initializeCustomerDatabase, 1000);
setTimeout(initializeCustomerDatabase, 2000);
