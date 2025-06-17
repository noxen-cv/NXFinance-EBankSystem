// Simple Customer Database Implementation
(function() {
    console.log('Simple customer database script loaded');
    
    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState != 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }
    
    async function loadAndDisplayCustomers() {
        console.log('Starting simple customer load...');
        
        const tableBody = document.getElementById('customerTableBody');
        const totalCustomersEl = document.getElementById('totalCustomers');
        
        if (!tableBody) {
            console.error('Table body not found');
            return;
        }
        
        try {
            // Clear any existing content
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading customers...</td></tr>';            // Fetch customer data from the correct API server
            const apiUrl = window.API_CONFIG ? 
                window.API_CONFIG.getUrl('/api/admin/customers') : 
                'http://localhost:3000/api/admin/customers';
            console.log('Fetching from:', apiUrl);
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            console.log('Got customer data:', data);
            
            if (data.success && data.customers) {
                const customers = data.customers;
                
                // Update summary
                if (totalCustomersEl) {
                    totalCustomersEl.textContent = customers.length;
                }
                
                // Update other summary fields
                const activeAccountsEl = document.getElementById('activeAccounts');
                const newCustomersEl = document.getElementById('newCustomers');
                
                if (activeAccountsEl) activeAccountsEl.textContent = customers.length;
                if (newCustomersEl) newCustomersEl.textContent = Math.floor(customers.length / 4);
                
                // Clear table and add customers
                tableBody.innerHTML = '';
                
                customers.forEach(customer => {
                    const row = document.createElement('tr');
                    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
                    const registrationDate = customer.created_at ? 
                        new Date(customer.created_at).toLocaleDateString() : 'N/A';
                    
                    row.innerHTML = `
                        <td><input type="checkbox"></td>
                        <td>${customer.id}</td>
                        <td>${fullName}</td>
                        <td>${customer.email || 'N/A'}</td>
                        <td>${customer.phone_number || 'N/A'}</td>
                        <td>${registrationDate}</td>
                        <td><span class="status-badge active">Active</span></td>
                        <td>0</td>
                        <td>
                            <button class="action-btn view">View</button>
                            <button class="action-btn edit">Edit</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                
                console.log(`Successfully displayed ${customers.length} customers`);
                
                // Update pagination
                const pageIndicator = document.getElementById('pageIndicator');
                if (pageIndicator) {
                    const pages = Math.ceil(customers.length / 10);
                    pageIndicator.textContent = `Page 1 of ${pages}`;
                }
                
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Error loading customers:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center;color:red;">
                        Error: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    // Initialize when ready
    ready(() => {
        console.log('DOM ready, loading customers...');
        setTimeout(loadAndDisplayCustomers, 100);
    });
    
    // Also try after window load
    window.addEventListener('load', () => {
        setTimeout(loadAndDisplayCustomers, 500);
    });
    
})();
