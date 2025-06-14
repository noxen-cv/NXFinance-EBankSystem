document.addEventListener('DOMContentLoaded', function() {
    // Initialize page animation
    initPageAnimation();
    
    // Set active menu item
    setActiveMenuItem();
    
    // Loan history data will be fetched from API
    let loanHistoryData = [];
    
    // Load loan history data from server
    async function loadLoanHistory() {
        try {
            const response = await fetch('/api/admin/loans', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load loan history');
            }
            
            const data = await response.json();
            
            // Update admin name
            document.getElementById('adminUsername').textContent = data.adminName || 'Admin';
            
            // Update loan summary statistics
            updateLoanSummary(data.summary);
            
            // Update loan history table
            if (data.loans && Array.isArray(data.loans)) {
                loanHistoryData = data.loans;
                applyFiltersAndSort();
            }
            
        } catch (error) {
            console.error('Error loading loan history:', error);
            showEmptyState();
        }
    }
    
    // Update loan summary statistics
    function updateLoanSummary(summary) {
        if (!summary) return;
        
        // Update loan counts
        document.getElementById('totalLoans').textContent = summary.totalLoans || 0;
        document.getElementById('activeLoans').textContent = summary.activeLoans || 0;
        
        // Update total loan value
        const totalLoanValue = summary.totalLoanValue || 0;
        document.getElementById('totalLoanValue').textContent = `₱${totalLoanValue.toLocaleString()}`;
        
        // Update repayment percentages
        document.getElementById('onTimePercentage').textContent = `${summary.onTimePercentage || 0}%`;
        document.getElementById('latePercentage').textContent = `${summary.latePercentage || 0}%`;
        document.getElementById('defaultedPercentage').textContent = `${summary.defaultedPercentage || 0}%`;
    }
    
    // Get auth token from localStorage
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    // Show empty state with message when no data is available
    function showEmptyState() {
        const tableBody = document.getElementById('loanHistoryTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-message">
                        <i class="material-icons">info</i>
                        <p>No loan history data available. New loans will appear here.</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Table filters
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('searchInput');
    
    // Filter change event listeners
    if (statusFilter) statusFilter.addEventListener('change', applyFiltersAndSort);
    if (dateFilter) dateFilter.addEventListener('change', applyFiltersAndSort);
    if (sortFilter) sortFilter.addEventListener('change', applyFiltersAndSort);
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Debounce search input
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(applyFiltersAndSort, 300);
        });
    }
    
    // Apply all filters and sort to the table
    function applyFiltersAndSort() {
        const currentStatusFilter = statusFilter ? statusFilter.value : 'all';
        const currentDateFilter = dateFilter ? dateFilter.value : 'all';
        const currentSortFilter = sortFilter ? sortFilter.value : 'newest';
        const currentSearchQuery = (searchInput ? searchInput.value : '').toLowerCase().trim();
        
        // Filter loan history data
        const filteredData = loanHistoryData.filter(item => {
            // Search query filter
            if (currentSearchQuery) {
                const nameMatch = item.name.toLowerCase().includes(currentSearchQuery);
                const idMatch = item.id.toLowerCase().includes(currentSearchQuery);
                const purposeMatch = (item.purpose && item.purpose.toLowerCase().includes(currentSearchQuery));
                
                if (!nameMatch && !idMatch && !purposeMatch) {
                    return false;
                }
            }
            
            // Status filter
            if (currentStatusFilter !== 'all' && item.status.toLowerCase() !== currentStatusFilter.toLowerCase()) {
                return false;
            }
            
            // Date filter
            if (currentDateFilter !== 'all') {
                const loanStartDate = new Date(item.startDate);
                const currentDate = new Date();
                
                if (currentDateFilter === 'month') {
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
                    return loanStartDate >= oneMonthAgo;
                } else if (currentDateFilter === 'quarter') {
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
                    return loanStartDate >= threeMonthsAgo;
                } else if (currentDateFilter === 'year') {
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
                    return loanStartDate >= oneYearAgo;
                }
            }
            
            return true;
        });
        
        // Sort the filtered data
        filteredData.sort((a, b) => {
            if (currentSortFilter === 'newest') {
                return new Date(b.startDate) - new Date(a.startDate);
            } else if (currentSortFilter === 'oldest') {
                return new Date(a.startDate) - new Date(b.startDate);
            } else if (currentSortFilter === 'highest') {
                return b.amount - a.amount;
            } else if (currentSortFilter === 'lowest') {
                return a.amount - b.amount;
            }
            return 0;
        });
        
        // Update the table with filtered and sorted data
        populateLoanTable(filteredData);
        
        // Update result count
        const resultCountElement = document.getElementById('resultCount');
        if (resultCountElement) {
            resultCountElement.textContent = filteredData.length;
        }
    }
    
    // Populate loan history table
    function populateLoanTable(data) {
        const tableBody = document.getElementById('loanHistoryTableBody');
        if (!tableBody) return;
        
        // Clear existing content
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            showEmptyState();
            return;
        }
        
        // Add each loan to the table
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Format dates
            const formattedStartDate = formatDate(item.startDate);
            const formattedDueDate = formatDate(item.dueDate);
            
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>₱${item.amount.toLocaleString()}</td>
                <td>${item.interestRate}</td>
                <td>${item.term}</td>
                <td>${formattedStartDate}</td>
                <td>${formattedDueDate}</td>
                <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td>
                    <button class="view-details-btn" data-loan-id="${item.id}">
                        <i class="material-icons">visibility</i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to view details buttons
        const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
        viewDetailsBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const loanId = this.getAttribute('data-loan-id');
                viewLoanDetails(loanId);
            });
        });
    }
    
    // Format date to readable form
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // View loan details (placeholder function)
    function viewLoanDetails(loanId) {
        console.log(`View details for loan ID: ${loanId}`);
        // This would typically open a modal or navigate to a detail page
        alert(`Viewing details for loan ${loanId} - This feature is under development`);
    }
    
    // Initialize sidebar toggle functionality
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
    
    // Toggle sidebar on button click
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function() {
            if (window.innerWidth < 769) {
                sidebar.classList.toggle('closed');
                sidebar.classList.toggle('open');
            } else {
                dashboardContainer.classList.toggle('sidebar-closed');
                dashboardContainer.classList.toggle('sidebar-open');
            }
        });
    }
    
    // Close sidebar when clicking on backdrop
    if (backdrop) {
        backdrop.addEventListener('click', function() {
            if (window.innerWidth < 769 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                sidebar.classList.add('closed');
            }
        });
    }
    
    // Load data when page loads
    loadLoanHistory();
});
