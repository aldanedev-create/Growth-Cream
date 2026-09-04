// Spark animation system
export class Sparks {
    constructor() {
        this.sparkSymbols = ['✦', '✧', '·', '+', '•'];
        this.container = null;
        this.ensureContainer();
    }
    
    ensureContainer() {
        this.container = document.getElementById('sparks-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'sparks-container';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            `;
            document.body.appendChild(this.container);
        }
    }
    
    burst(x, y, count = 5) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) return;
        
        for (let i = 0; i < count; i++) {
            this.createSpark(x, y);
        }
    }
    
    createSpark(x, y) {
        const spark = document.createElement('span');
        spark.className = 'spark-burst';
        spark.textContent = this.sparkSymbols[Math.floor(Math.random() * this.sparkSymbols.length)];
        
        const angle = (Math.random() * Math.PI * 2);
        const distance = 20 + Math.random() * 40;
        const sparkX = Math.cos(angle) * distance;
        const sparkY = Math.sin(angle) * distance - 20;
        
        spark.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            color: var(--pink);
            font-size: ${12 + Math.random() * 12}px;
            pointer-events: none;
            z-index: 9999;
            animation: spark-burst ${0.4 + Math.random() * 0.3}s ease-out forwards;
            --spark-x: ${sparkX}px;
            --spark-y: ${sparkY}px;
        `;
        
        this.container.appendChild(spark);
        
        spark.addEventListener('animationend', () => {
            spark.remove();
        });
        
        // Fallback cleanup
        setTimeout(() => {
            if (spark.parentElement) {
                spark.remove();
            }
        }, 1000);
    }
    
    ambientSparks() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) return;
        
        // Create occasional ambient sparks
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight * 0.5;
                this.createSpark(x, y);
            }
        }, 3000);
    }
    
    celebrate() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.burst(
                    centerX + (Math.random() - 0.5) * 200,
                    centerY + (Math.random() - 0.5) * 100,
                    8 + Math.random() * 5
                );
            }, i * 200);
        }
    }
}

export const sparks = new Sparks();