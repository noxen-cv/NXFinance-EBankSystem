// ScrollAnimations.js
class ScrollAnimations {
    constructor() {
        // Initialize observers
        this.setupObservers();
        
        // Start observing elements
        this.observeElements();
    }    setupObservers() {
        const options = {
            root: null, // Use viewport as root
            rootMargin: '0px', // No margin
            threshold: 0.15 // Trigger when 15% of element is visible
        };

        // Create observer for scroll animations
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.hasAnimated) {
                    // Mark the element as animated
                    entry.target.hasAnimated = true;
                    // Get animation direction from data attribute or default to 'up'
                    const direction = entry.target.dataset.animate || 'up';
                    this.animateElement(entry.target, direction);
                    // Unobserve the element after animation
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    }

    observeElements() {        // Observe all sections that haven't been animated yet
        document.querySelectorAll('section:not(.animated)').forEach(section => {
            if (!section.hasAnimated) {
                section.style.opacity = '0';
                this.observer.observe(section);
            }
        });

        // Observe other elements that haven't been animated
        document.querySelectorAll('.animate-on-scroll:not(.animated), .hero-title:not(.animated), .hero-subtitle:not(.animated), .hero-text:not(.animated), .feature-card:not(.animated), .carousel-card:not(.animated)').forEach(element => {
            if (!element.hasAnimated) {
                element.style.opacity = '0';
                this.observer.observe(element);
            }
        });

        // Special handling for staggered children that haven't been animated
        document.querySelectorAll('.stagger-children').forEach(parent => {
            Array.from(parent.children).forEach((child, index) => {
                if (!child.hasAnimated) {
                    child.style.opacity = '0';
                    child.dataset.staggerIndex = index;
                    this.observer.observe(child);
                }
            });
        });
    }    animateElement(element, direction = 'up') {
        // Base animation properties with smooth easing
        const animations = {
            up: [
                { transform: 'translateY(30px)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            down: [
                { transform: 'translateY(-30px)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ],
            left: [
                { transform: 'translateX(-30px)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ],
            right: [
                { transform: 'translateX(30px)', opacity: 0 },
                { transform: 'translateX(0)', opacity: 1 }
            ],
            scale: [
                { transform: 'scale(0.95)', opacity: 0 },
                { transform: 'scale(1)', opacity: 1 }
            ]
        };

        // Animation timing with smoother easing
        const timing = {
            duration: 600,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth, natural easing
            fill: 'forwards',
            iterations: 1 // Ensure animation only plays once
        };

        // Add stagger delay if element is part of staggered children
        if (element.dataset.staggerIndex) {
            timing.delay = parseInt(element.dataset.staggerIndex) * 100;
        }

        // Animate using Web Animations API
        element.animate(animations[direction], timing);
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScrollAnimations();
});
