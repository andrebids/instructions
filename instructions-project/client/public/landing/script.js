// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('py-2');
        navbar.classList.remove('py-4');
    } else {
        navbar.classList.add('py-4');
        navbar.classList.remove('py-2');
    }
});

// Reveal Animations on Scroll
const revealElements = document.querySelectorAll('.feature-item, .group');

revealElements.forEach((element) => {
    gsap.fromTo(element,
        {
            opacity: 0,
            y: 50
        },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 85%', // Start animation when element is 85% down the viewport
                toggleActions: 'play none none reverse'
            }
        }
    );
});

// Staggered animation for value prop cards
// Staggered animation for Value Proposition cards
gsap.from('#value-proposition .grid > div', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
        trigger: '#value-proposition',
        start: 'top 80%'
    }
});

// Staggered animation for AI Costs cards
gsap.from('#costs .grid > div', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
        trigger: '#costs',
        start: 'top 80%'
    }
});

// Comparison Section Animation
gsap.from('#comparison .grid > div', {
    opacity: 0,
    x: (index) => index === 0 ? -50 : 50, // Slide in from sides
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: {
        trigger: '#comparison',
        start: 'top 70%'
    }
});
