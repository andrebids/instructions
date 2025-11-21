/**
 * Suggestion Card Cycler
 * Rotates through suggested decor items in the "Smart Discovery" section.
 */

class SuggestionCycler {
    constructor() {
        this.suggestions = [
            {
                image: 'images/gx350.jpg',
                name: 'GX350',
                stock: '13+ Units Available',
                label: 'Suggested for Place de la Mairie'
            },
            {
                image: 'images/suggestion-swirl-new.jpg',
                name: 'PG-2400',
                stock: '8 Units Available',
                label: 'Suggested for Rue Victor Hugo'
            }
        ];
        this.currentIndex = 0;
        this.interval = 4000; // Switch every 4 seconds

        this.card = document.getElementById('suggestion-card');
        this.image = document.getElementById('suggestion-image');
        this.name = document.getElementById('suggestion-name');
        this.stock = document.getElementById('suggestion-stock');
        this.label = document.getElementById('suggestion-label');
        this.timer = document.getElementById('suggestion-timer');

        if (this.card) {
            this.startCycling();
        }
    }

    startCycling() {
        // Initial progress bar animation
        this.resetTimer();

        setInterval(() => {
            this.cycle();
        }, this.interval);
    }

    resetTimer() {
        if (this.timer) {
            this.timer.style.transition = 'none';
            this.timer.style.width = '0%';

            // Force reflow
            void this.timer.offsetWidth;

            this.timer.style.transition = `width ${this.interval}ms linear`;
            this.timer.style.width = '100%';
        }
    }

    cycle() {
        // Fade out content
        this.card.style.opacity = '0';

        setTimeout(() => {
            // Update content
            this.currentIndex = (this.currentIndex + 1) % this.suggestions.length;
            const item = this.suggestions[this.currentIndex];

            this.image.src = item.image;
            this.image.alt = item.name;
            this.name.textContent = item.name;
            this.stock.textContent = item.stock;
            if (this.label) this.label.textContent = item.label;

            // Fade in content
            this.card.style.opacity = '1';

            // Restart timer
            this.resetTimer();
        }, 500); // Wait for fade out (matches CSS transition duration)
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SuggestionCycler();
});
