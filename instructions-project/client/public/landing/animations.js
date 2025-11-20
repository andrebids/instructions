/**
 * GSAP Animations
 * Hero section entrance and scroll animations
 */

class HeroAnimations {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.currentX = 0;
        this.currentY = 0;

        this.init();
    }

    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.createEntranceTimeline();
        this.setupScrollAnimations();
        this.setupTechSpecsAnimations();
    }

    createEntranceTimeline() {
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Headline staggered reveal
        timeline.from(".hero-text-line-1, .hero-text-line-2", {
            y: 80,
            opacity: 0,
            duration: 1.2,
            stagger: 0.15
        });

        // Subtext fade in
        timeline.from(".hero-subtext", {
            y: 40,
            opacity: 0,
            duration: 0.8
        }, "-=0.6");

        // 3D Mockup - Float up with blur-to-focus effect
        timeline.from("#mockup-container", {
            y: 150,
            opacity: 0,
            filter: "blur(20px)",
            duration: 1.5,
            ease: "power2.out",
            duration: 1.5,
            ease: "power2.out"
        }, "-=0.6");
    }



    setupScrollAnimations() {
        gsap.utils.toArray(".glass-card").forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });
        });
    }

    setupTechSpecsAnimations() {
        // Counter animation
        ScrollTrigger.create({
            trigger: "#tech-specs",
            start: "top 80%",
            once: true,
            onEnter: () => {
                document.querySelectorAll('.counter').forEach(counter => {
                    this.animateCounter(counter);
                });
            }
        });

        // Terminal typewriter effect
        ScrollTrigger.create({
            trigger: ".terminal-content",
            start: "top 80%",
            once: true,
            onEnter: () => {
                const lines = document.querySelectorAll('.terminal-content > div');
                gsap.from(lines, {
                    opacity: 0,
                    x: -20,
                    duration: 0.3,
                    stagger: 0.1,
                    ease: "power2.out"
                });
            }
        });
    }

    animateCounter(element) {
        const target = parseFloat(element.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            if (target >= 100) {
                element.textContent = Math.floor(current);
            } else {
                element.textContent = current.toFixed(2);
            }
        }, 16);
    }
}
