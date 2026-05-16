/*--------------------
Vars
--------------------*/
const deg = (a) => (Math.PI / 180) * a;
const rand = (v1, v2) => Math.floor(v1 + Math.random() * (v2 - v1));
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
let width = 0;
let height = 0;
window.windowWidth = 0;
window.windowHeight = 0;
let canvas = null;
let ctx = null;
const opt = {
    particles: 250,
    noiseScale: 0.005,
    angle: (Math.PI / 180) * -90,
    h1: rand(0, 360),
    h2: rand(0, 360),
    s1: rand(20, 90),
    s2: rand(20, 90),
    l1: rand(30, 80),
    l2: rand(30, 80),
    strokeWeight: 2,
    tail: 82,
};

const Particles = [];
let time = 0;
let inGame = false;

function hashNoise(i, j, k) {
    const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
    return x - Math.floor(x);
}

function noise(x, y, z = 0) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;

    const n000 = hashNoise(xi, yi, zi);
    const n100 = hashNoise(xi + 1, yi, zi);
    const n010 = hashNoise(xi, yi + 1, zi);
    const n110 = hashNoise(xi + 1, yi + 1, zi);
    const n001 = hashNoise(xi, yi, zi + 1);
    const n101 = hashNoise(xi + 1, yi, zi + 1);
    const n011 = hashNoise(xi, yi + 1, zi + 1);
    const n111 = hashNoise(xi + 1, yi + 1, zi + 1);

    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const nx00 = lerp(n000, n100, u);
    const nx10 = lerp(n010, n110, u);
    const nx01 = lerp(n001, n101, u);
    const nx11 = lerp(n011, n111, u);

    const nxy0 = lerp(nx00, nx10, v);
    const nxy1 = lerp(nx01, nx11, v);

    return lerp(nxy0, nxy1, w);
}

function changeTitleColor() {
    const title = document.getElementById('title');
    if (!title) {
        return;
    }
    title.style.backgroundImage = `linear-gradient(hsl(${opt.h1 + 20}, ${opt.s1}%, ${opt.l1}%), hsl(${opt.h2}, ${opt.s2}%, ${opt.l2}%))`;
}

function createCanvas(w, h) {
    const container = document.getElementById('particles');
    if (!container) {
        return null;
    }

    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    container.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas(w, h);
    return canvas;
}

function resizeCanvas(w, h) {
    width = w;
    height = h;
    window.windowWidth = w;
    window.windowHeight = h;
    if (canvas) {
        canvas.width = w;
        canvas.height = h;
    }
}

function background(color, alpha) {
    if (!ctx) {
        return;
    }
    if (typeof alpha === 'undefined') {
        ctx.fillStyle = typeof color === 'number' ? `rgb(${color}, ${color}, ${color})` : color;
    } else {
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha / 100})`;
    }
    ctx.fillRect(0, 0, width, height);
}

function stroke(color) {
    if (!ctx) {
        return;
    }
    ctx.strokeStyle = color;
}

function line(x1, y1, x2, y2) {
    if (!ctx) {
        return;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function strokeWeight(value) {
    if (!ctx) {
        return;
    }
    ctx.lineWidth = value;
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    for (let i = 0; i < opt.particles; i++) {
        Particles.push(new Particle(Math.random() * width, Math.random() * height));
    }
    strokeWeight(opt.strokeWeight);
}

function draw() {
    if (!ctx) {
        return;
    }
    if (!inGame && document.visibilityState === 'visible') {
        time++;
        background(0, 100 - opt.tail);
        for (let p of Particles) {
            p.update();
            p.render();
        }
    } else {
        background(0);
    }
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lx = x;
        this.ly = y;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.hueSem = Math.random();
        this.hue = this.hueSem > 0.5 ? 20 + opt.h1 : 20 + opt.h2;
        this.sat = this.hueSem > 0.5 ? opt.s1 : opt.s2;
        this.light = this.hueSem > 0.5 ? opt.l1 : opt.l2;
        this.maxSpeed = this.hueSem > 0.5 ? 3 : 2;
    }

    randomize() {
        this.hueSem = Math.random();
        this.hue = this.hueSem > 0.5 ? 20 + opt.h1 : 20 + opt.h2;
        this.sat = this.hueSem > 0.5 ? opt.s1 : opt.s2;
        this.light = this.hueSem > 0.5 ? opt.l1 : opt.l2;
        this.maxSpeed = this.hueSem > 0.5 ? 3 : 2;
    }

    update() {
        this.follow();
        this.vx += this.ax;
        this.vy += this.ay;
        const p = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const a = Math.atan2(this.vy, this.vx);
        const m = Math.min(this.maxSpeed, p);
        this.vx = Math.cos(a) * m;
        this.vy = Math.sin(a) * m;
        this.x += this.vx;
        this.y += this.vy;
        this.ax = 0;
        this.ay = 0;
        this.edges();
    }

    follow() {
        const angle = noise(this.x * opt.noiseScale, this.y * opt.noiseScale, time * opt.noiseScale) * Math.PI * 0.5 + opt.angle;
        this.ax += Math.cos(angle);
        this.ay += Math.sin(angle);
    }

    updatePrev() {
        this.lx = this.x;
        this.ly = this.y;
    }

    edges() {
        if (this.x < 0) {
            this.x = width;
            this.updatePrev();
        }
        if (this.x > width) {
            this.x = 0;
            this.updatePrev();
        }
        if (this.y < 0) {
            this.y = height;
            this.updatePrev();
        }
        if (this.y > height) {
            this.y = 0;
            this.updatePrev();
        }
    }

    render() {
        stroke(`hsla(${this.hue}, ${this.sat}%, ${this.light}%, .5)`);
        line(this.x, this.y, this.lx, this.ly);
        this.updatePrev();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    changeTitleColor();
    setup();
    function loop() {
        draw();
        requestAnimationFrame(loop);
    }
    loop();
});

window.addEventListener('resize', windowResized);

document.body.addEventListener('click', () => {
    if (inGame) {
        return;
    }
    opt.h1 = rand(0, 360);
    opt.h2 = rand(0, 360);
    opt.s1 = rand(20, 90);
    opt.s2 = rand(20, 90);
    opt.l1 = rand(30, 80);
    opt.l2 = rand(30, 80);
    opt.angle += deg(rand(0, 60)) * (Math.random() > 0.5 ? 1 : -1);
    setTimeout(() => {
        changeTitleColor();
    }, 120);
    for (let p of Particles) {
        p.randomize();
    }
});
