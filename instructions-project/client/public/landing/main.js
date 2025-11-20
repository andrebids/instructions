/**
 * Main Application Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Aurora Background
    const aurora = new AuroraBackground('aurora-canvas');
    aurora.enableMouseInteraction('hero-section');

    // Initialize Animations
    const heroAnimations = new HeroAnimations();
});
