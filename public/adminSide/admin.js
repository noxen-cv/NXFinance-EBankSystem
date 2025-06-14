document.addEventListener('DOMContentLoaded', function() {
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
        },        options: {
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
    });    // Sample loan data
    const loanData = [
        {
            name: 'John Doe',
            amount: 300000,
            cardType: 'Visa Platinum',
            date: '2025-06-24',
            purpose: 'Home Renovation',
            status: 'Lunas'
        },
        {
            name: 'Jane Smith',
            amount: 300000,
            cardType: 'MasterCard Gold',
            date: '2025-06-24',
            purpose: 'Education',
            status: 'Belum lunas'
        },
        {
            name: 'Mike Johnson',
            amount: 300000,
            cardType: 'Visa Signature',
            date: '2025-06-24',
            purpose: 'Business Expansion',
            status: 'Lunas'
        },
        {
            name: 'Sarah Wilson',
            amount: 300000,
            cardType: 'MasterCard Titanium',
            date: '2025-06-24',
            purpose: 'Medical Expenses',
            status: 'Belum lunas'
        },
        {
            name: 'Tom Brown',
            amount: 300000,
            cardType: 'Visa Infinite',
            date: '2025-06-24',
            purpose: 'Debt Consolidation',
            status: 'Lunas'
        }
    ];    // Credit card application data
    const cardData = [
        {
            name: 'Emily Clark',
            amount: 250000,
            cardType: 'Visa Platinum',
            date: '2025-06-18',
            purpose: 'Travel Expenses',
            status: 'Lunas'
        },
        {
            name: 'David Lee',
            amount: 400000,
            cardType: 'MasterCard Gold',
            date: '2025-06-20',
            purpose: 'Vehicle Purchase',
            status: 'Belum lunas'
        },
        {
            name: 'Jessica Wang',
            amount: 350000,
            cardType: 'Visa Signature',
            date: '2025-06-22',
            purpose: 'Wedding Expenses',
            status: 'Lunas'
        },
        {
            name: 'Robert Chen',
            amount: 280000,
            cardType: 'MasterCard Titanium',
            date: '2025-06-23',
            purpose: 'Home Appliances',
            status: 'Belum lunas'
        },
        {
            name: 'Lisa Adams',
            amount: 320000,
            cardType: 'Visa Infinite',
            date: '2025-06-25',
            purpose: 'Business Startup',
            status: 'Lunas'
        }
    ];

    // Function to populate a table with data
    function populateTable(tableId, data) {
        const tableBody = document.getElementById(tableId);
        if (!tableBody) return;
        
        tableBody.innerHTML = ''; // Clear existing content
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="data-checkbox"></td>
                <td>${item.name}</td>
                <td>₱${item.amount.toLocaleString()}</td>
                <td>${item.cardType}</td>
                <td>${item.date}</td>
                <td>${item.purpose}</td>
                <td><span class="status-badge status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span></td>
                <td><a href="#" class="action-btn">Action</a></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Populate both tables
    populateTable('loanTableBody', loanData);
    populateTable('cardTableBody', cardData);

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

    setupSelectAllCheckbox('selectAllLoan', 'loanTableBody');
    setupSelectAllCheckbox('selectAllCard', 'cardTableBody');

    selectAllCheckbox.addEventListener('change', function() {
        loanCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });    // This section has been replaced by the new sidebar toggle functionality at the top of this file

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
    let hasNotification = true;

    if (hasNotification) {
        const badge = document.createElement('span');
        badge.classList.add('notification-badge');
        notificationBtn.appendChild(badge);
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
