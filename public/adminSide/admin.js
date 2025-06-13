document.addEventListener('DOMContentLoaded', function() {
    // Initialize the loan progress chart
    const ctx = document.getElementById('loanProgressChart').getContext('2d');
    const loanProgressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [45, 55],
                backgroundColor: [
                    '#0088cc',
                    '#f5f5f5'
                ],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    enabled: true
                }
            }
        }
    });

    // Sample loan data
    const loanData = [
        {
            name: 'John Doe',
            amount: 300000,
            date: '2025-06-24',
            status: 'Lunas'
        },
        {
            name: 'Jane Smith',
            amount: 300000,
            date: '2025-06-24',
            status: 'Belum lunas'
        },
        {
            name: 'Mike Johnson',
            amount: 300000,
            date: '2025-06-24',
            status: 'Lunas'
        },
        {
            name: 'Sarah Wilson',
            amount: 300000,
            date: '2025-06-24',
            status: 'Belum lunas'
        },
        {
            name: 'Tom Brown',
            amount: 300000,
            date: '2025-06-24',
            status: 'Lunas'
        }
    ];

    // Populate the loan table
    const tableBody = document.getElementById('loanTableBody');
    loanData.forEach(loan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="loan-checkbox"></td>
            <td>${loan.name}</td>
            <td>₱${loan.amount.toLocaleString()}</td>
            <td>${loan.date}</td>
            <td><span class="status-badge status-${loan.status.toLowerCase().replace(' ', '-')}">${loan.status}</span></td>
            <td><a href="#" class="action-btn">Action</a></td>
        `;
        tableBody.appendChild(row);
    });

    // Handle "Select All" checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    const loanCheckboxes = document.querySelectorAll('.loan-checkbox');

    selectAllCheckbox.addEventListener('change', function() {
        loanCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // Handle responsive sidebar toggle
    const menuButton = document.createElement('button');
    menuButton.innerHTML = '<i class="material-icons">menu</i>';
    menuButton.classList.add('menu-toggle');
    document.querySelector('.dashboard-header').prepend(menuButton);

    menuButton.addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const menuBtn = document.querySelector('.menu-toggle');
        
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

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
