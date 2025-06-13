class NavMenu {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.isOpen = false;
        this.init();
    }

    init() {
        // Initialize hamburger menu
        this.hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Handle click outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.navMenu.contains(e.target) && !this.hamburger.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMenu();
            }
        });

        // Handle menu item clicks
        const menuItems = this.navMenu.querySelectorAll('a');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMenu();
                }
            });
        });
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.hamburger.classList.toggle('active');
        this.navMenu.classList.toggle('active');
        
        if (this.isOpen) {
            document.body.style.overflow = 'hidden';
            this.navMenu.style.display = 'flex';
            setTimeout(() => {
                this.navMenu.style.transform = 'translateY(0)';
                this.navMenu.style.opacity = '1';
            }, 10);
        } else {
            this.closeMenu();
        }
    }

    closeMenu() {
        this.isOpen = false;
        this.hamburger.classList.remove('active');
        this.navMenu.style.transform = 'translateY(-20px)';
        this.navMenu.style.opacity = '0';
        
        setTimeout(() => {
            if (!this.isOpen) {
                this.navMenu.classList.remove('active');
                this.navMenu.style.display = '';
                document.body.style.overflow = '';
            }
        }, 300);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavMenu();
    
    // Handle login button clicks
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnDesktop = document.getElementById('loginBtnDesktop');

    const handleLogin = (e) => {
        e.preventDefault();
        document.body.style.transition = 'opacity 0.5s';
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    };

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (loginBtnDesktop) loginBtnDesktop.addEventListener('click', handleLogin);
});
