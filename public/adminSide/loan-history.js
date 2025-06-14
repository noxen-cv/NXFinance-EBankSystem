document.addEventListener('DOMContentLoaded', function() {
    // Initialize page animation
    initPageAnimation();
    
    // Set active menu item
    setActiveMenuItem();
    
    // Sample loan history data
    const loanHistoryData = [
        {
            name: 'John Doe',
            id: 'LN2025001',
            amount: 300000,
            interestRate: '12%',
            term: '24 months',
            startDate: '2025-01-15',
            dueDate: '2027-01-15',
            status: 'Active'
        },
        {
            name: 'Jane Smith',
            id: 'LN2025002',
            amount: 150000,
            interestRate: '10%',
            term: '12 months',
            startDate: '2025-02-20',
            dueDate: '2026-02-20',
            status: 'Late'
        },
        {
            name: 'Michael Johnson',
            id: 'LN2024050',
            amount: 500000,
            interestRate: '15%',
            term: '36 months',
            startDate: '2024-08-10',
            dueDate: '2027-08-10',
            status: 'Active'
        },
        {
            name: 'Emily Brown',
            id: 'LN2024023',
            amount: 200000,
            interestRate: '11%',
            term: '24 months',
            startDate: '2024-12-05',
            dueDate: '2026-12-05',
            status: 'Completed'
        },
        {
            name: 'David Wilson',
            id: 'LN2024089',
            amount: 350000,
            interestRate: '14%',
            term: '24 months',
            startDate: '2024-09-30',
            dueDate: '2026-09-30',
            status: 'Defaulted'
        },
        {
            name: 'Sarah Taylor',
            id: 'LN2025008',
            amount: 180000,
            interestRate: '9.5%',
            term: '18 months',
            startDate: '2025-03-15',
            dueDate: '2026-09-15',
            status: 'Active'
        },
        {
            name: 'Robert Martinez',
            id: 'LN2024102',
            amount: 420000,
            interestRate: '13%',
            term: '36 months',
            startDate: '2024-11-20',
            dueDate: '2027-11-20',
            status: 'Active'
        },
        {
            name: 'Jennifer Lee',
            id: 'LN2024067',
            amount: 250000,
            interestRate: '12.5%',
            term: '24 months',
            startDate: '2024-07-25',
            dueDate: '2026-07-25',
            status: 'Completed'
        },
        {
            name: 'Thomas Anderson',
            id: 'LN2025012',
            amount: 280000,
            interestRate: '11.5%',
            term: '30 months',
            startDate: '2025-05-05',
            dueDate: '2027-11-05',
            status: 'Active'
        },
        {
            name: 'Jessica Williams',
            id: 'LN2024095',
            amount: 320000,
            interestRate: '13.5%',
            term: '24 months',
            startDate: '2024-10-10',
            dueDate: '2026-10-10',
            status: 'Late'
        }
    ];

    // Pagination variables
    let currentPage = 1;
    const rowsPerPage = 5;
    let filteredData = [...loanHistoryData];

    // Function to populate loan history table
    function populateHistoryTable(page = 1) {
        const tableBody = document.getElementById('loanHistoryTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = ''; // Clear existing content
        
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
        
        // Update page indicator
        const pageIndicator = document.getElementById('pageIndicator');
        if (pageIndicator) {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            pageIndicator.textContent = `Page ${page} of ${totalPages || 1}`;
        }
        
        // Enable/disable pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= Math.ceil(filteredData.length / rowsPerPage);
        
        // Create rows for the current page
        for (let i = startIndex; i < endIndex; i++) {
            const item = filteredData[i];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><input type="checkbox" class="history-checkbox"></td>
                <td>${item.name}</td>
                <td>${item.id}</td>
                <td>₱${item.amount.toLocaleString()}</td>
                <td>${item.interestRate}</td>
                <td>${item.term}</td>
                <td>${formatDate(item.startDate)}</td>
                <td>${formatDate(item.dueDate)}</td>
                <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                <td><a href="#" class="action-btn">Details</a></td>
            `;
            
            tableBody.appendChild(row);
        }
    }

    // Format date to MM/DD/YYYY
    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }

    // Handle filters
    function applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        
        filteredData = loanHistoryData.filter(item => {
            // Status filter
            if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter) {
                return false;
            }
            
            // Date filter
            if (dateFilter !== 'all') {
                const loanStartDate = new Date(item.startDate);
                const currentDate = new Date();
                
                if (dateFilter === 'month') {
                    if (loanStartDate.getMonth() !== currentDate.getMonth() || 
                        loanStartDate.getFullYear() !== currentDate.getFullYear()) {
                        return false;
                    }
                } else if (dateFilter === 'quarter') {
                    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
                    const loanQuarter = Math.floor(loanStartDate.getMonth() / 3);
                    
                    if (loanQuarter !== currentQuarter || 
                        loanStartDate.getFullYear() !== currentDate.getFullYear()) {
                        return false;
                    }
                } else if (dateFilter === 'year') {
                    if (loanStartDate.getFullYear() !== currentDate.getFullYear()) {
                        return false;
                    }
                }
            }
            
            // Search filter
            if (searchInput) {
                const searchFields = [
                    item.name.toLowerCase(),
                    item.id.toLowerCase(),
                    item.status.toLowerCase()
                ];
                
                return searchFields.some(field => field.includes(searchInput));
            }
            
            return true;
        });
        
        // Reset to first page after filtering
        currentPage = 1;
        populateHistoryTable(currentPage);
    }

    // Initialize table
    populateHistoryTable(currentPage);

    // Set up event listeners
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('dateFilter')?.addEventListener('change', applyFilters);
    document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
    document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // Pagination controls
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            populateHistoryTable(currentPage);
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function() {
        if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
            currentPage++;
            populateHistoryTable(currentPage);
        }
    });

    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllHistory');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const historyCheckboxes = document.querySelectorAll('.history-checkbox');
            historyCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }    // Handle responsive sidebar toggle - same as admin.js for consistency
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
    
    // Function to set the active menu item based on current page
    function setActiveMenuItem() {
        const currentPage = window.location.pathname.split('/').pop();
        const menuItems = document.querySelectorAll('.sidebar-nav .nav-item');
        
        menuItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            
            if (href === currentPage || 
                (currentPage === '' && href === 'admin.html') || 
                (currentPage === 'index.html' && href === 'admin.html')) {                item.classList.add('active');
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
});
