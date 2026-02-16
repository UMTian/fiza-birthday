const darkScreen = document.getElementById('dark-screen');
const birthdayScreen = document.getElementById('birthday-screen');
const audio = document.getElementById('birthdayAudio');
const bgEffects = document.getElementById('bg-effects');

// Canvas Setup
const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx = fwCanvas.getContext('2d');
const pCanvas = document.getElementById('particles-canvas');
const pCtx = pCanvas.getContext('2d');
const lCanvas = document.getElementById('lightning-canvas');
const lCtx = lCanvas.getContext('2d');

[fwCanvas, pCanvas, lCanvas].forEach(c => {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
});

// Particle Systems
let particles = [];
let fireworks = [];
let autoPoppers = [];
let lightningTimer = 0;

class Particle {
    constructor(x, y, color, type = 'burst', speed = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.size = Math.random() * 6 + 2;
        const angle = Math.random() * Math.PI * 2;
        const velocity = type === 'explosion' ? Math.random() * 15 + 8 : Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * velocity * speed;
        this.vy = Math.sin(angle) * velocity * speed;
        this.gravity = type === 'explosion' ? 0.2 : 0.05;
        this.friction = 0.98;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 15;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.rotation += this.rotationSpeed;
        this.alpha -= this.decay;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.type === 'confetti') {
            ctx.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
        } else if (this.type === 'sparkle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Firework {
    constructor(x, y, targetY, auto = false) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.speed = auto ? Math.random() * 3 + 6 : 8;
        this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 30 + 70;
        this.trail = [];
        this.auto = auto;
    }

    update() {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();
        
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;

        if (this.vy >= 0 || this.y <= this.targetY) {
            this.explode();
            return false;
        }
        return true;
    }

    draw() {
        fwCtx.beginPath();
        fwCtx.moveTo(this.trail[0]?.x || this.x, this.trail[0]?.y || this.y);
        for (let point of this.trail) {
            fwCtx.lineTo(point.x, point.y);
        }
        fwCtx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 0.5)`;
        fwCtx.lineWidth = 3;
        fwCtx.stroke();

        fwCtx.beginPath();
        fwCtx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        fwCtx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, 1)`;
        fwCtx.fill();
    }

    explode() {
        const colors = [];
        for (let i = 0; i < 3; i++) {
            colors.push(`hsla(${this.hue + i * 30}, 100%, 70%, 1)`);
        }
        
        for (let i = 0; i < (this.auto ? 80 : 100); i++) {
            particles.push(new Particle(this.x, this.y, colors[i % colors.length], 'explosion'));
        }
        
        // Flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at ${this.x}px ${this.y}px, rgba(255,255,255,0.3) 0%, transparent 50%);
            pointer-events: none; z-index: 4; animation: fadeOut 0.5s ease forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }
}

// Animation Loops
function animateFireworks() {
    fwCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);

    if (Math.random() < 0.03) {
        const x = Math.random() * fwCanvas.width;
        const targetY = Math.random() * (fwCanvas.height / 2);
        fireworks.push(new Firework(x, fwCanvas.height, targetY, true));
    }

    fireworks = fireworks.filter(fw => {
        fw.draw();
        return fw.update();
    });

    requestAnimationFrame(animateFireworks);
}

function animateParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles = particles.filter(p => {
        p.draw(pCtx);
        return p.update();
    });
    requestAnimationFrame(animateParticles);
}

// Lightning Effect
function drawLightning() {
    lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
    lightningTimer++;
    
    if (lightningTimer > 200 && Math.random() < 0.02) {
        lightningTimer = 0;
        const x = Math.random() * lCanvas.width;
        lCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        lCtx.lineWidth = 2;
        lCtx.beginPath();
        lCtx.moveTo(x, 0);
        
        let currentX = x;
        let currentY = 0;
        
        while (currentY < lCanvas.height) {
            currentX += (Math.random() - 0.5) * 50;
            currentY += Math.random() * 30 + 10;
            lCtx.lineTo(currentX, currentY);
        }
        
        lCtx.stroke();
        
        setTimeout(() => {
            lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
        }, 100);
    }
    
    requestAnimationFrame(drawLightning);
}

// Create Background Orbs
function createOrbs() {
    const colors = ['#ff006e', '#8338ec', '#3a86ff', '#ffbe0b', '#06ffa5'];
    for (let i = 0; i < 5; i++) {
        const orb = document.createElement('div');
        orb.className = 'orb';
        orb.style.width = Math.random() * 300 + 200 + 'px';
        orb.style.height = orb.style.width;
        orb.style.background = colors[i];
        orb.style.left = Math.random() * 100 + '%';
        orb.style.top = Math.random() * 100 + '%';
        orb.style.animationDelay = i * 2 + 's';
        orb.style.animationDuration = (10 + i * 2) + 's';
        bgEffects.appendChild(orb);
    }
}

// Create Streamers
function createStreamer() {
    const streamer = document.createElement('div');
    streamer.className = 'streamer';
    streamer.style.left = Math.random() * 100 + '%';
    streamer.style.background = `linear-gradient(to bottom, 
        hsl(${Math.random() * 360}, 100%, 70%), 
        hsl(${Math.random() * 360}, 100%, 50%))`;
    streamer.style.animationDuration = (Math.random() * 2 + 3) + 's';
    streamer.style.borderRadius = '4px';
    birthdayScreen.appendChild(streamer);
    setTimeout(() => streamer.remove(), 4000);
}

// Create Sparkles
function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    sparkle.style.animationDelay = Math.random() * 2 + 's';
    sparkle.style.boxShadow = '0 0 10px 2px rgba(255,255,255,0.8)';
    bgEffects.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 2000);
}

// Party Popper
function createPartyPopper(x, y, auto = false) {
    const popper = document.createElement('div');
    popper.className = 'party-popper';
    popper.style.left = x + 'px';
    popper.style.top = y + 'px';
    
    const hue = Math.random() * 360;
    popper.innerHTML = `
        <div class="popper-body" style="background: linear-gradient(135deg, hsl(${hue}, 100%, 60%), hsl(${hue}, 100%, 40%));">
            <div class="popper-top"></div>
        </div>
        <div class="popper-string"></div>
    `;
    
    const burst = () => {
        const rect = popper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create confetti explosion
        for (let i = 0; i < 60; i++) {
            const color = `hsla(${Math.random() * 360}, 100%, 70%, 1)`;
            particles.push(new Particle(centerX, centerY, color, 'confetti'));
        }
        
        // Flash
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; left: ${centerX - 100}px; top: ${centerY - 100}px;
            width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none; z-index: 100;
            animation: fadeOut 0.3s ease forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
        
        popper.style.transform = 'scale(0)';
        popper.style.transition = 'transform 0.2s';
        setTimeout(() => popper.remove(), 200);
        
        if (!auto) setTimeout(() => createPartyPopper(Math.random() * (window.innerWidth - 100), Math.random() * (window.innerHeight - 150)), 2000);
    };
    
    if (auto) {
        setTimeout(burst, 1000 + Math.random() * 2000);
    } else {
        popper.onclick = (e) => {
            e.stopPropagation();
            burst();
        };
    }
    
    birthdayScreen.appendChild(popper);
}

// Balloon
function createBalloon(x, y) {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.style.left = x + 'px';
    balloon.style.top = y + 'px';
    
    const hue = Math.random() * 360;
    const color = `hsl(${hue}, 100%, 60%)`;
    const darkColor = `hsl(${hue}, 100%, 40%)`;
    
    balloon.innerHTML = `
        <div class="balloon-body" style="background: linear-gradient(135deg, ${color}, ${darkColor});">
            <div class="balloon-knot" style="border-top-color: ${darkColor};"></div>
        </div>
        <div class="balloon-string"></div>
    `;
    
    balloon.onclick = function(e) {
        e.stopPropagation();
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 40; i++) {
            particles.push(new Particle(centerX, centerY, color, 'sparkle'));
        }
        
        this.style.transform = 'scale(1.4)';
        this.style.opacity = '0';
        this.style.transition = 'all 0.15s';
        setTimeout(() => this.remove(), 150);
        
        setTimeout(() => createBalloon(Math.random() * (window.innerWidth - 100), Math.random() * (window.innerHeight - 200)), 1500);
    };
    
    birthdayScreen.appendChild(balloon);
}

// Start Celebration
function startCelebration() {
    // Play audio
    audio.play().catch(e => console.log('Audio error:', e));
    
    // Transition
    darkScreen.classList.add('hidden');
    
    setTimeout(() => {
        darkScreen.style.display = 'none';
        birthdayScreen.classList.add('active');
        
        // Initialize everything
        createOrbs();
        animateFireworks();
        animateParticles();
        drawLightning();
        
        // Initial grand explosion
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const x = Math.random() * window.innerWidth;
                const targetY = Math.random() * (window.innerHeight / 3);
                fireworks.push(new Firework(x, window.innerHeight, targetY, true));
            }, i * 200);
        }
        
        // Spawn poppers (some auto-burst, some clickable)
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                createPartyPopper(
                    Math.random() * (window.innerWidth - 100), 
                    Math.random() * (window.innerHeight - 150),
                    i < 3 // First 3 auto-burst
                );
            }, 500 + i * 300);
        }
        
        // Spawn balloons
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                createBalloon(
                    Math.random() * (window.innerWidth - 100),
                    Math.random() * (window.innerHeight - 200)
                );
            }, i * 200);
        }
        
        // Continuous effects
        setInterval(() => createStreamer(), 500);
        setInterval(() => createSparkle(), 200);
        
        // Replenish interactive elements
        setInterval(() => {
            if (document.querySelectorAll('.party-popper').length < 5) {
                createPartyPopper(Math.random() * (window.innerWidth - 100), Math.random() * (window.innerHeight - 150));
            }
        }, 3000);
        
        setInterval(() => {
            if (document.querySelectorAll('.balloon').length < 8) {
                createBalloon(Math.random() * (window.innerWidth - 100), Math.random() * (window.innerHeight - 200));
            }
        }, 4000);
        
    }, 1500);
}

// Click anywhere for magic
birthdayScreen.addEventListener('click', (e) => {
    if (e.target === birthdayScreen || e.target.id === 'bg-effects') {
        for (let i = 0; i < 20; i++) {
            const color = `hsla(${Math.random() * 360}, 100%, 70%, 1)`;
            particles.push(new Particle(e.clientX, e.clientY, color, 'sparkle'));
        }
    }
});

// Resize handler
window.addEventListener('resize', () => {
    [fwCanvas, pCanvas, lCanvas].forEach(c => {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
    });
});

// CSS injection for fadeOut
const style = document.createElement('style');
style.textContent = `@keyframes fadeOut { to { opacity: 0; transform: scale(1.5); } }`;
document.head.appendChild(style);