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
    let cardData = [];      // Load dashboard data from API
    async function loadDashboardData() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const apiUrl = '/api/admin/dashboard';
                
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load dashboard data: ' + response.status);
            }
            
            const data = await response.json();
            
            // Update admin name
            if (data.admin && data.admin.user) {
                document.getElementById('adminUsername').textContent = data.admin.user.username || 'Admin';
            }
            
            // Update dashboard metrics
            document.getElementById('clientNumber').textContent = data.customerCount || 0;
            
            // Update loan health percentage
            if (data.loanHealth !== undefined) {
                updateLoanProgress(data.loanHealth);
            }
            
            // Update available limit
            if (data.availableLimit !== undefined) {                document.getElementById('availableLimit').textContent = `₱${data.availableLimit.toLocaleString()}`;
            }
            
        } catch (error) {
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
    function showErrorMessage(message) {        // Implementation depends on your UI for showing messages
        console.error(message);
        // You could add a notification system here
    }

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
