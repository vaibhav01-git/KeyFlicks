// Enhanced Hacker Theme Effects
class HackerEffects {
    constructor() {
        this.digitalRainContainer = document.getElementById('digital-rain');
        this.init();
    }
    
    init() {
        this.createDigitalRain();
        this.addScanLines();
    }
    
    createDigitalRain() {
        if (!this.digitalRainContainer) return;
        
        const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const columns = Math.floor(window.innerWidth / 20);
        
        for (let i = 0; i < columns; i++) {
            if (Math.random() > 0.7) { // Only 30% chance to create a column
                this.createRainColumn(i * 20, characters);
            }
        }
        
        // Recreate rain periodically
        setInterval(() => {
            if (Math.random() > 0.8) {
                const randomColumn = Math.floor(Math.random() * columns);
                this.createRainColumn(randomColumn * 20, characters);
            }
        }, 2000);
    }
    
    createRainColumn(leftPosition, characters) {
        const column = document.createElement('div');
        column.className = 'rain-column';
        column.style.left = leftPosition + 'px';
        column.style.animationDuration = (Math.random() * 5 + 5) + 's';
        column.style.animationDelay = Math.random() * 2 + 's';
        
        let text = '';
        const length = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < length; i++) {
            text += characters[Math.floor(Math.random() * characters.length)] + '<br>';
        }
        column.innerHTML = text;
        
        this.digitalRainContainer.appendChild(column);
        
        // Remove after animation
        setTimeout(() => {
            if (column.parentNode) {
                column.parentNode.removeChild(column);
            }
        }, 12000);
    }
    
    addScanLines() {
        const containers = document.querySelectorAll('.keyflicks-card');
        containers.forEach(container => {
            container.classList.add('scan-lines');
        });
    }
}

// Initialize hacker effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HackerEffects();
});

// Add glitch effect to logo occasionally
setInterval(() => {
    const logo = document.getElementById('google-logo');
    if (logo && Math.random() > 0.9) {
        logo.classList.add('glitch');
        logo.setAttribute('data-text', logo.textContent);
        setTimeout(() => {
            logo.classList.remove('glitch');
        }, 500);
    }
}, 10000);

// Add holographic effect to cards on hover
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.keyflicks-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('holographic');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('holographic');
        });
    });
});