/**
 * Aurora Canvas Animation
 * Living mesh gradient background
 */

class AuroraBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.blobs = [];

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.createBlobs(5);
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    createBlobs(count) {
        for (let i = 0; i < count; i++) {
            this.blobs.push(new Blob(this.canvas));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.blobs.forEach(blob => {
            blob.update();
            blob.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }

    enableMouseInteraction(heroSectionId) {
        const heroSection = document.getElementById(heroSectionId);

        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            this.blobs.forEach((blob) => {
                const targetX = x * this.canvas.width;
                const targetY = y * this.canvas.height;
                blob.vx += (targetX - blob.x) * 0.00005;
                blob.vy += (targetY - blob.y) * 0.00005;
            });
        });
    }
}

class Blob {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 300 + 200;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.color = Math.random() > 0.5 ? '#A19AFE' : '#F9D7A0';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < -this.radius || this.x > this.canvas.width + this.radius) {
            this.vx *= -1;
        }
        if (this.y < -this.radius || this.y > this.canvas.height + this.radius) {
            this.vy *= -1;
        }
    }

    draw(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color + '40');
        gradient.addColorStop(1, this.color + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
