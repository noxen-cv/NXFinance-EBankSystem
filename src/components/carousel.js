document.addEventListener('DOMContentLoaded', () => {
    // Carousel drag and animation
    const track = document.querySelector('.carousel-track');
    const prevButton = document.querySelector('.carousel-nav.prev');
    const nextButton = document.querySelector('.carousel-nav.next');
    let isDown = false;
    let startX;
    let scrollLeft;

// Card width calculation
const cardWidth = document.querySelector('.carousel-card').offsetWidth;
const gap = 32; // This should match the gap in your CSS

if (track) {
    track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.classList.add('active');
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', () => {
        isDown = false;
        track.classList.remove('active');
    });
    track.addEventListener('mouseup', () => {
        isDown = false;
        track.classList.remove('active');
    });
    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 2; //scroll-fast
        track.scrollLeft = scrollLeft - walk;
    });
    // Touch events for mobile
    track.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
    });
    track.addEventListener('touchend', () => {
        isDown = false;
    });
    track.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - track.offsetLeft;
        const walk = (x - startX) * 2;
        track.scrollLeft = scrollLeft - walk;
    });
}

// Navigation button functionality
if (prevButton && nextButton) {    prevButton.addEventListener('click', () => {
        track.scrollBy({
            left: -(cardWidth + gap),
            behavior: 'smooth'
        });
    });nextButton.addEventListener('click', () => {
        track.scrollBy({
            left: cardWidth + gap,
            behavior: 'smooth'
        });
    });

    // Show/hide buttons based on scroll position
    const updateButtonVisibility = () => {
        prevButton.style.opacity = track.scrollLeft <= 0 ? '0' : '1';
        prevButton.style.pointerEvents = track.scrollLeft <= 0 ? 'none' : 'all';
        
        const maxScroll = track.scrollWidth - track.clientWidth;
        nextButton.style.opacity = track.scrollLeft >= maxScroll ? '0' : '1';
        nextButton.style.pointerEvents = track.scrollLeft >= maxScroll ? 'none' : 'all';
    };

    track.addEventListener('scroll', updateButtonVisibility);
    window.addEventListener('resize', updateButtonVisibility);
      // Initial button visibility
    updateButtonVisibility();
}
});
