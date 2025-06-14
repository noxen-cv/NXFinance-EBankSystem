document.addEventListener('DOMContentLoaded', function() {
    // Initialize page animation
    initPageAnimation();
    
    // Set active menu item
    setActiveMenuItem();
    
    // Profile image functionality
    const imageUpload = document.getElementById('imageUpload');
    const adminProfileImage = document.getElementById('adminProfileImage');
    
    // Handle image upload
    if (imageUpload && adminProfileImage) {
        imageUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    adminProfileImage.src = e.target.result;
                    // Save to localStorage
                    saveImageToLocalStorage(e.target.result);
                    showNotification('Profile image updated successfully!', 'success');
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Load saved profile data when page loads
    loadProfileImage();
    loadProfileInfo();
    
    // Load profile image from localStorage if available
    function loadProfileImage() {
        const savedImage = localStorage.getItem('adminProfileImage');
        if (savedImage && adminProfileImage) {
            adminProfileImage.src = savedImage;
        } else if (adminProfileImage) {
            // Set default image if no saved image exists
            adminProfileImage.src = "../Assets/NX Finance Logo Transparent Black.png";
        }
    }
    
    // Save profile image to localStorage
    function saveImageToLocalStorage(imageData) {
        localStorage.setItem('adminProfileImage', imageData);
    }
    
    // Load profile info from localStorage if available
    function loadProfileInfo() {
        const firstName = localStorage.getItem('adminFirstName') || 'First Name';
        const lastName = localStorage.getItem('adminLastName') || 'Last Name';
        const email = localStorage.getItem('adminEmail') || 'admin@nxfinance.com';
        const phone = localStorage.getItem('adminPhone') || '+1 (555) 123-4567';
        const department = localStorage.getItem('adminDepartment') || 'Finance Operations';
        const role = localStorage.getItem('adminRole') || 'System Administrator';
        
        // Update display fields
        document.getElementById('firstName').textContent = firstName;
        document.getElementById('lastName').textContent = lastName;
        document.getElementById('adminEmail').textContent = email;
        document.getElementById('adminPhone').textContent = phone;
        document.getElementById('adminDepartment').textContent = department;
        document.getElementById('adminRole').textContent = role;
        
        // Update form fields
        document.getElementById('inputFirstName').value = firstName;
        document.getElementById('inputLastName').value = lastName;
        if (email) document.getElementById('inputEmail').value = email;
        if (phone) document.getElementById('inputPhone').value = phone;
        if (department) document.getElementById('inputDepartment').value = department;
    }
    
    // Modal functionality
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const cancelPasswordBtn = document.getElementById('cancelPasswordChange');
    
    // Open edit profile modal
    if (editProfileBtn && editProfileModal) {
        editProfileBtn.addEventListener('click', function() {
            editProfileModal.style.display = 'block';
        });
    }
    
    // Open change password modal
    if (changePasswordBtn && changePasswordModal) {
        changePasswordBtn.addEventListener('click', function() {
            changePasswordModal.style.display = 'block';
        });
    }
    
    // Close modals with X button
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
            changePasswordModal.style.display = 'none';
        });
    });
    
    // Close modals with cancel button
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            editProfileModal.style.display = 'none';
        });
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', function() {
            changePasswordModal.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
        if (e.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    });
    
    // Handle profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const firstName = document.getElementById('inputFirstName').value;
            const lastName = document.getElementById('inputLastName').value;
            const email = document.getElementById('inputEmail').value;
            const phone = document.getElementById('inputPhone').value;
            const department = document.getElementById('inputDepartment').value;
            
            // Update profile display
            document.getElementById('firstName').textContent = firstName;
            document.getElementById('lastName').textContent = lastName;
            document.getElementById('adminEmail').textContent = email;
            document.getElementById('adminPhone').textContent = phone;
            document.getElementById('adminDepartment').textContent = department;
            
            // Save to localStorage
            localStorage.setItem('adminFirstName', firstName);
            localStorage.setItem('adminLastName', lastName);
            localStorage.setItem('adminEmail', email);
            localStorage.setItem('adminPhone', phone);
            localStorage.setItem('adminDepartment', department);
            
            // Close the modal
            editProfileModal.style.display = 'none';
            
            // Show success message
            showNotification('Profile updated successfully!', 'success');
        });    }
    
    // Handle password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate
            if (currentPassword === '') {
                showNotification('Please enter your current password', 'error');
                return;
            }
            
            if (newPassword === '') {
                showNotification('Please enter a new password', 'error');
                return;
            }
            
            // Password validation
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            // In a real application, password would be verified with the server
            // For demo purposes, just show success
            showNotification('Password changed successfully!', 'success');
            
            // Reset form and close modal
            passwordForm.reset();            changePasswordModal.style.display = 'none';
            
            // Reset form
            passwordForm.reset();
            
            // Show success message
            showNotification('Password changed successfully!', 'success');
        });
    }
    
    // Show notification function
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="material-icons">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</i>
                <span>${message}</span>
            </div>
            <i class="material-icons close-notification">close</i>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        // Close on click
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
      // Sidebar toggle functionality (same as admin.js for consistency)
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    
    if (sidebarToggleBtn && dashboardContainer && sidebar) {
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
        if (backdrop) {
            backdrop.addEventListener('click', function() {
                if (window.innerWidth < 769 && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    sidebar.classList.add('closed');
                }
            });
        }
        
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
    }
    
    // Create and add notification styling
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.15);
            border-radius: 6px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 1060;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification.error {
            border-left: 4px solid #F44336;
        }
        
        .notification.info {
            border-left: 4px solid #2196F3;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .notification-content i {
            font-size: 20px;
        }
        
        .notification.success .notification-content i {
            color: #4CAF50;
        }
        
        .notification.error .notification-content i {
            color: #F44336;
        }
        
        .notification.info .notification-content i {
            color: #2196F3;
        }
        
        .close-notification {
            cursor: pointer;
            font-size: 18px;
            opacity: 0.7;
        }
        
        .close-notification:hover {
            opacity: 1;
        }
    `;    document.head.appendChild(styleElement);
    
    // Initialize profile data
    loadProfileImage();
    loadProfileInfo();
});

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

// Function to set the active menu item based on current page
function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.sidebar-nav .nav-item');
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        
        if (href === currentPage ||            (currentPage === '' && href === 'admin.html') || 
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
