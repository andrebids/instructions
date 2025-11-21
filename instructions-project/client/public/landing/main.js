/**
 * Main Application Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Aurora Background
    const aurora = new AuroraBackground('aurora-canvas');
    aurora.enableMouseInteraction('hero-section');

    // Initialize Animations
    const heroAnimations = new HeroAnimations();

    // Initialize Compare Slider
    initCompareSlider();

    // 3D Mouse Tracking Effect for Mockup
    const mockup3D = document.getElementById('mockup-3d');
    const heroSection = document.getElementById('hero-section');

    if (mockup3D && heroSection) {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;

        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate mouse position relative to center (-1 to 1)
            mouseX = (e.clientX - rect.left - centerX) / centerX;
            mouseY = (e.clientY - rect.top - centerY) / centerY;
        });

        // Smooth animation loop
        function animate() {
            // Smooth interpolation (easing)
            currentX += (mouseX - currentX) * 0.1;
            currentY += (mouseY - currentY) * 0.1;

            // Calculate rotation based on mouse position
            const rotateY = currentX * 25; // Increased rotation on Y axis
            const rotateX = -currentY * 15; // Increased rotation on X axis

            // Apply transform with enhanced 3D effect
            mockup3D.style.transform = `
                rotateX(${12 + rotateX}deg) 
                rotateY(${-2 + rotateY}deg) 
                rotateZ(0deg) 
                scale(0.9)
                translateZ(40px)
            `;

            requestAnimationFrame(animate);
        }

        animate();

        // Reset on mouse leave
        heroSection.addEventListener('mouseleave', () => {
            mouseX = 0;
            mouseY = 0;
        });
    }
});

/**
 * Compare Slider Logic
 */
function initCompareSlider() {
    const container = document.getElementById('compare-container');
    const beforeImage = document.getElementById('before-image');
    const beforeImageImg = beforeImage ? beforeImage.querySelector('img') : null;
    const sliderHandle = document.getElementById('slider-handle');

    if (!container || !beforeImage || !sliderHandle) return;

    let isDragging = false;

    const onMove = (e) => {
        if (!isDragging) return;

        const rect = container.getBoundingClientRect();
        let x = (e.clientX || e.touches[0].clientX) - rect.left;

        // Clamp values
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        const percentage = (x / rect.width) * 100;

        // Update DOM
        beforeImage.style.width = `${percentage}%`;
        sliderHandle.style.left = `${percentage}%`;

        // Counter-scale the image to prevent squishing
        if (beforeImageImg) {
            beforeImageImg.style.width = `${100 / (percentage / 100)}%`;
        }
    };

    const onStart = () => {
        isDragging = true;
    };

    const onEnd = () => {
        isDragging = false;
    };

    // Mouse Events
    container.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Touch Events
    container.addEventListener('touchstart', onStart);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
}
