document.addEventListener('DOMContentLoaded', function() {
    // Debug logging function
    function debugLog(message) {
        const logElement = document.getElementById('debug-log');
        if (logElement) {
            const time = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = 'log';
            logEntry.textContent = `${time}: ${message}`;
            logElement.appendChild(logEntry);
            
            // Keep only the last 20 log entries
            const logs = logElement.getElementsByClassName('log');
            if (logs.length > 20) {
                logElement.removeChild(logs[0]);
            }
        }
        console.log(message);
    }

    // Debug: Check if table elements exist
    debugLog('DOM loaded, checking elements:');
    debugLog('- loanTableBody exists: ' + Boolean(document.getElementById('loanTableBody')));
    debugLog('- cardTableBody exists: ' + Boolean(document.getElementById('cardTableBody')));
    debugLog('- clientNumber exists: ' + Boolean(document.getElementById('clientNumber')));
    debugLog('- loanHealthPercentage exists: ' + Boolean(document.getElementById('loanHealthPercentage')));
    debugLog('- availableLimit exists: ' + Boolean(document.getElementById('availableLimit')));
    
    // Initialize page animation
    initPageAnimation();
    
    // Set active menu item
    setActiveMenuItem();
    
    // Sidebar Toggle Functionality
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    
    // Set initial state
    if (window.innerWidth < 769) {
        sidebar.classList.add('closed');
        sidebar.classList.remove('open');
    } else {
        dashboardContainer.classList.add('sidebar-open');
    }
    
    sidebarToggleBtn.addEventListener('click', function() {
        if (window.innerWidth < 769) {
            sidebar.classList.toggle('closed');
            sidebar.classList.toggle('open');
        } else {
            dashboardContainer.classList.toggle('sidebar-closed');
            dashboardContainer.classList.toggle('sidebar-open');
        }
    });
    
    // Close sidebar when clicking on the backdrop
    backdrop.addEventListener('click', function() {
        if (window.innerWidth < 769 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            sidebar.classList.add('closed');
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 769 && 
            !sidebar.contains(e.target) && 
            !sidebarToggleBtn.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            sidebar.classList.add('closed');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth < 769) {
            dashboardContainer.classList.remove('sidebar-closed');
            dashboardContainer.classList.remove('sidebar-open');
            if (!sidebar.classList.contains('open')) {
                sidebar.classList.add('closed');
            }
        } else {
            sidebar.classList.remove('closed');
            sidebar.classList.remove('open');
            if (!dashboardContainer.classList.contains('sidebar-closed')) {
                dashboardContainer.classList.add('sidebar-open');
            }
        }
    });

    // Initialize the loan progress chart
    const ctx = document.getElementById('loanProgressChart').getContext('2d');
    const loanProgressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100],
                backgroundColor: [
                    '#0088cc',
                    '#f5f5f5'
                ],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            }
        }
    });

    // Initialize data arrays
    let loanData = [];
    let cardData = [];
      // Load dashboard data from API
    async function loadDashboardData() {
        try {
            debugLog('Starting to load dashboard data');
            // Always use the hardcoded API 
            const apiUrl = 'http://localhost:3200/api/admin/dashboard';
                
            debugLog('Current hostname: ' + window.location.hostname);
            debugLog('Fetching dashboard data from: ' + apiUrl);
                
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load dashboard data: ' + response.status);
            }
            
            debugLog('API response received, parsing...');
            const data = await response.json();
            debugLog('Data parsed successfully');
            
            // Update admin name
            if (data.admin && data.admin.user) {
                document.getElementById('adminUsername').textContent = data.admin.user.username || 'Admin';
                debugLog('Updated admin username');
            }
            
            debugLog('Dashboard data loaded');
            
            // Update dashboard metrics
            document.getElementById('clientNumber').textContent = data.customerCount || 0;
            debugLog('Updated client number: ' + (data.customerCount || 0));
            
            // Update loan health percentage
            if (data.loanHealth !== undefined) {
                updateLoanProgress(data.loanHealth);
                debugLog('Updated loan health: ' + data.loanHealth + '%');
            }
            
            // Update available limit
            if (data.availableLimit !== undefined) {
                document.getElementById('availableLimit').textContent = `₱${data.availableLimit.toLocaleString()}`;
                debugLog('Updated available limit: ₱' + data.availableLimit.toLocaleString());
            }
            
            // Update tables
            if (data.approvedLoans) {
                loanData = data.approvedLoans;
                debugLog('Got ' + data.approvedLoans.length + ' approved loans');
                populateTable('loanTableBody', loanData);
            }
            
            if (data.pendingLoans) {
                cardData = data.pendingLoans;
                debugLog('Got ' + data.pendingLoans.length + ' pending loans');
                populateTable('cardTableBody', cardData);
            }
            
            debugLog('Dashboard data loading complete');
            
        } catch (error) {
            debugLog('ERROR: ' + error.message);
            console.error('Error loading dashboard data:', error);
            showErrorMessage('Failed to load dashboard data. Please try again later.');
        }
    }
    
    // Update loan progress chart
    function updateLoanProgress(percentage) {
        // Update chart
        loanProgressChart.data.datasets[0].data = [percentage, 100 - percentage];
        loanProgressChart.update();
        
        // Update text
        document.getElementById('loanHealthPercentage').textContent = `${percentage}%`;
        document.getElementById('loanHealthDetail').textContent = `*${percentage}% out of 100%`;
    }
    
    // Helper function to get auth token from localStorage
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    // Show error message
    function showErrorMessage(message) {
        // Implementation depends on your UI for showing messages
        console.error(message);
        // You could add a notification system here
    }    // Function to populate a table with data
    function populateTable(tableId, data) {
        const tableBody = document.getElementById(tableId);
        if (!tableBody) {
            debugLog(`ERROR: Table body with id ${tableId} not found`);
            return;
        }
        
        debugLog(`Populating table ${tableId} with ${data.length} items`);
        tableBody.innerHTML = ''; // Clear existing content
        
        try {
            data.forEach((item, index) => {
                const row = document.createElement('tr');
                // Handle number formatting safely
                const formattedAmount = typeof item.amount === 'number' 
                    ? item.amount.toLocaleString() 
                    : parseFloat(item.amount || 0).toLocaleString();
                    
                row.innerHTML = `
                    <td><input type="checkbox" class="data-checkbox"></td>
                    <td>${item.name || 'Unknown'}</td>
                    <td>₱${formattedAmount}</td>
                    <td>${item.cardType || 'Unknown'}</td>
                    <td>${item.date || 'Unknown'}</td>
                    <td>${item.purpose || 'General Purpose'}</td>
                    <td><span class="status-badge status-${(item.status || '').toLowerCase().replace(' ', '-')}">${item.status || 'Unknown'}</span></td>
                    <td><a href="#" class="action-btn">Action</a></td>
                `;
                tableBody.appendChild(row);
                
                if (index === 0) {
                    debugLog(`Added first row to ${tableId}: ${item.name}`);
                }
            });
            
            debugLog(`Completed populating table ${tableId} with ${data.length} rows`);
        } catch (err) {
            debugLog(`ERROR populating table ${tableId}: ${err.message}`);
        }
    }

    // Handle "Select All" checkboxes
    function setupSelectAllCheckbox(selectAllId, tableBodyId) {
        const selectAllCheckbox = document.getElementById(selectAllId);
        if (!selectAllCheckbox) return;
        
        selectAllCheckbox.addEventListener('change', function() {
            const tableBody = document.getElementById(tableBodyId);
            const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }

    // Setup select all checkboxes
    setupSelectAllCheckbox('selectAllLoan', 'loanTableBody');
    setupSelectAllCheckbox('selectAllCard', 'cardTableBody');

    // Add hover animation to action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('mouseover', function() {
            this.style.textDecoration = 'underline';
        });
        btn.addEventListener('mouseout', function() {
            this.style.textDecoration = 'none';
        });
    });

    // Notification badge animation
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        let hasNotification = true;
        if (hasNotification) {
            const badge = document.createElement('span');
            badge.classList.add('notification-badge');
            notificationBtn.appendChild(badge);
        }
    }
    
    // Load dashboard data
    loadDashboardData();
});

// Function to set the active menu item based on current page
function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.sidebar-nav .nav-item');
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        
        if (href === currentPage || 
            (currentPage === '' && href === 'admin.html') || 
            (currentPage === 'index.html' && href === 'admin.html')) {
            item.classList.add('active');
        }
        
        // Add smooth page transition
        item.addEventListener('click', function(e) {
            if (href !== currentPage) {
                e.preventDefault();
                const mainContent = document.querySelector('.main-content');
                mainContent.style.opacity = '0';
                mainContent.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
}

// Function to initialize page animation
function initPageAnimation() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '0';
        setTimeout(() => {
            mainContent.style.transition = 'opacity 0.3s ease';
            mainContent.style.opacity = '1';
        }, 10);
    }
}
