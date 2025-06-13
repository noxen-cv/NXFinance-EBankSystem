document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });

    // Cards carousel functionality
    const cardsCarousel = document.querySelector('.cards-carousel');
    const cards = document.querySelectorAll('.card');
    const prevBtn = document.querySelector('.nav-btn.prev');
    const nextBtn = document.querySelector('.nav-btn.next');
    
    let startX;
    let scrollLeft;
    let isDown = false;

    // Mouse controls for cards carousel
    if (cardsCarousel) {
        // Touch events for mobile
        cardsCarousel.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - cardsCarousel.offsetLeft;
            scrollLeft = cardsCarousel.scrollLeft;
        });

        cardsCarousel.addEventListener('touchend', () => {
            isDown = false;
        });

        cardsCarousel.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.touches[0].pageX - cardsCarousel.offsetLeft;
            const walk = (x - startX) * 2;
            cardsCarousel.scrollLeft = scrollLeft - walk;
        });

        // Mouse events for desktop
        cardsCarousel.addEventListener('mousedown', (e) => {
            isDown = true;
            cardsCarousel.style.cursor = 'grabbing';
            startX = e.pageX - cardsCarousel.offsetLeft;
            scrollLeft = cardsCarousel.scrollLeft;
        });

        cardsCarousel.addEventListener('mouseleave', () => {
            isDown = false;
            cardsCarousel.style.cursor = 'grab';
        });

        cardsCarousel.addEventListener('mouseup', () => {
            isDown = false;
            cardsCarousel.style.cursor = 'grab';
        });

        cardsCarousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - cardsCarousel.offsetLeft;
            const walk = (x - startX) * 2;
            cardsCarousel.scrollLeft = scrollLeft - walk;
        });

        // Navigation buttons
        nextBtn?.addEventListener('click', () => {
            const cardWidth = cards[0].offsetWidth + 32; // including gap
            cardsCarousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });

        prevBtn?.addEventListener('click', () => {
            const cardWidth = cards[0].offsetWidth + 32; // including gap
            cardsCarousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });
    }

    // Card hover effects
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            cards.forEach(c => {
                if (c !== card) {
                    c.style.transform = 'scale(0.95)';
                    c.style.opacity = '0.7';
                }
            });
        });

        card.addEventListener('mouseleave', () => {
            cards.forEach(c => {
                c.style.transform = 'translateY(0) scale(1)';
                c.style.opacity = '1';
            });
        });
    });

    // Recipient selection in Send Money section
    const recipients = document.querySelectorAll('.recipient');
    recipients.forEach(recipient => {
        recipient.addEventListener('click', () => {
            recipients.forEach(r => r.classList.remove('active'));
            recipient.classList.add('active');
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.card, .transaction-item, .send-money-section, .limits-section');
    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Amount input formatting
    const amountInput = document.querySelector('.amount-input input');
    if (amountInput) {
        amountInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9.]/g, '');
            if (value.split('.').length > 2) value = value.replace(/\.+$/, '');
            e.target.value = value;
        });
    }

    // Window resize handler for responsive design
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }, 250);
    });
});
