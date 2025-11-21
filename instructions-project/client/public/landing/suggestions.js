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
                stock: '13+ Units Available'
            },
            {
                image: 'images/suggestion-swirl-new.jpg',
                name: 'PG-2400',
                stock: '8 Units Available'
            }
        ];
        this.currentIndex = 0;
        this.interval = 4000; // Switch every 4 seconds

        this.card = document.getElementById('suggestion-card');
        this.image = document.getElementById('suggestion-image');
        this.name = document.getElementById('suggestion-name');
        this.stock = document.getElementById('suggestion-stock');

        if (this.card) {
            this.startCycling();
        }
    }

    startCycling() {
        setInterval(() => {
            this.cycle();
        }, this.interval);
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

            // Fade in content
            this.card.style.opacity = '1';
        }, 500); // Wait for fade out (matches CSS transition duration)
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SuggestionCycler();
});
