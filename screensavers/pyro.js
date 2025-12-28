const PyroScreensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,
  lastLaunchTime: 0,

  // Active elements
  rockets: [],
  particles: [],

  // Configuration
  launchFrequency: 5,
  explosionSize: 'medium',
  colorMode: 'rainbow',
  gravity: 1.0,

  // Firework types
  TYPES: ['burst', 'willow', 'ring', 'chrysanthemum', 'palm', 'crossette', 'multistage'],

  // Size multipliers
  SIZE_MULTIPLIERS: {
    small: 0.6,
    medium: 1.0,
    large: 1.5
  },

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Reset state
    this.rockets = [];
    this.particles = [];
    this.lastFrameTime = 0;
    this.lastLaunchTime = 0;

    // Apply settings
    this.launchFrequency = options.launchFrequency || 5;
    this.explosionSize = options.explosionSize || 'medium';
    this.colorMode = options.colorMode || 'rainbow';
    this.gravity = options.gravity || 1.0;

    // Preview mode support
    this.fixedWidth = options.width || null;
    this.fixedHeight = options.height || null;

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear canvas to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.animate();
  },

  handleResize: function() {
    if (window.PyroScreensaver.canvas && !window.PyroScreensaver.fixedWidth) {
      window.PyroScreensaver.resize();
    }
  },

  resize() {
    if (this.fixedWidth) {
      this.canvas.width = this.fixedWidth;
      this.canvas.height = this.fixedHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  },

  getColor() {
    switch (this.colorMode) {
      case 'warm':
        return `hsl(${Math.random() * 60}, 100%, 60%)`; // Red to yellow
      case 'cool':
        return `hsl(${180 + Math.random() * 120}, 100%, 60%)`; // Cyan to purple
      case 'monochrome':
        return `hsl(45, 100%, ${50 + Math.random() * 20}%)`; // Golden
      case 'rainbow':
      default:
        return `hsl(${Math.random() * 360}, 100%, 60%)`;
    }
  },

  launchRocket() {
    const x = Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1;
    const targetY = this.canvas.height * (0.15 + Math.random() * 0.35);
    const type = this.TYPES[Math.floor(Math.random() * this.TYPES.length)];
    const color = this.getColor();

    this.rockets.push({
      x: x,
      y: this.canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: -(8 + Math.random() * 4),
      targetY: targetY,
      type: type,
      color: color,
      trail: []
    });
  },

  updateRocket(rocket) {
    // Store trail position
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 8) {
      rocket.trail.shift();
    }

    // Update position
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.vy += 0.1; // Slight gravity on rocket

    // Check if reached target or slowing down enough
    return rocket.y <= rocket.targetY || rocket.vy >= -1;
  },

  drawRocket(rocket) {
    const ctx = this.ctx;

    // Draw trail
    ctx.save();
    for (let i = 0; i < rocket.trail.length; i++) {
      const t = rocket.trail[i];
      const alpha = (i / rocket.trail.length) * 0.6;
      const size = (i / rocket.trail.length) * 2;
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw rocket head
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  explode(rocket) {
    const sizeMult = this.SIZE_MULTIPLIERS[this.explosionSize] || 1.0;
    const isPreview = this.fixedWidth && this.fixedWidth < 600;
    const particleScale = isPreview ? 0.5 : 1.0;

    switch (rocket.type) {
      case 'burst':
        this.createBurst(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      case 'willow':
        this.createWillow(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      case 'ring':
        this.createRing(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      case 'chrysanthemum':
        this.createChrysanthemum(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      case 'palm':
        this.createPalm(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      case 'crossette':
        this.createCrossette(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      case 'multistage':
        this.createMultistage(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
        break;
      default:
        this.createBurst(rocket.x, rocket.y, rocket.color, sizeMult * particleScale);
    }
  },

  createBurst(x, y, color, scale) {
    const count = Math.floor(80 * scale);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.2;
      const speed = 3 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed * scale,
        vy: Math.sin(angle) * speed * scale,
        color: color,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        size: 2 * scale,
        trail: []
      });
    }
  },

  createWillow(x, y, color, scale) {
    const count = Math.floor(100 * scale);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed * scale,
        vy: Math.sin(angle) * speed * scale,
        color: color,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.005, // Slower decay for drooping effect
        size: 2 * scale,
        trail: [],
        willow: true // Heavy gravity effect
      });
    }
  },

  createRing(x, y, color, scale) {
    const count = Math.floor(40 * scale);
    const speed = 5 * scale;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 1.0,
        decay: 0.02,
        size: 3 * scale,
        trail: []
      });
    }
  },

  createChrysanthemum(x, y, color, scale) {
    const count = Math.floor(150 * scale);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed * scale,
        vy: Math.sin(angle) * speed * scale,
        color: color,
        life: 1.0,
        decay: 0.006 + Math.random() * 0.004, // Long lasting
        size: 1.5 * scale,
        trail: [],
        chrysanthemum: true
      });
    }
  },

  createPalm(x, y, color, scale) {
    const branches = 8;
    const particlesPerBranch = Math.floor(15 * scale);
    for (let b = 0; b < branches; b++) {
      const baseAngle = (Math.PI * 2 / branches) * b - Math.PI / 2; // Start upward
      for (let i = 0; i < particlesPerBranch; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * 0.3;
        const speed = 3 + i * 0.3;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed * scale,
          vy: Math.sin(angle) * speed * scale - 2, // Initial upward boost
          color: color,
          life: 1.0,
          decay: 0.012 + Math.random() * 0.008,
          size: 2.5 * scale,
          trail: [],
          palm: true
        });
      }
    }
  },

  createCrossette(x, y, color, scale) {
    const count = Math.floor(20 * scale);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = 4 * scale;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 1.0,
        decay: 0.025,
        size: 2.5 * scale,
        trail: [],
        crossette: true,
        splitTime: 0.5 + Math.random() * 0.2,
        hasSplit: false
      });
    }
  },

  createMultistage(x, y, color, scale) {
    // Initial burst
    const count = Math.floor(30 * scale);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = 3 * scale;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 1.0,
        decay: 0.03,
        size: 3 * scale,
        trail: [],
        multistage: true,
        stageTime: 0.4 + Math.random() * 0.2,
        hasTriggered: false,
        scale: scale
      });
    }
  },

  updateParticle(particle) {
    // Store trail
    particle.trail.push({ x: particle.x, y: particle.y, life: particle.life });
    if (particle.trail.length > 12) {
      particle.trail.shift();
    }

    // Apply velocity
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Apply gravity (heavier for willow)
    const gravityMult = particle.willow ? 2.5 : (particle.chrysanthemum ? 0.5 : 1.0);
    particle.vy += 0.08 * this.gravity * gravityMult;

    // Apply drag
    particle.vx *= 0.98;
    particle.vy *= 0.98;

    // Decay life
    particle.life -= particle.decay;

    // Handle crossette split
    if (particle.crossette && !particle.hasSplit && particle.life < particle.splitTime) {
      particle.hasSplit = true;
      this.createMiniExplosion(particle.x, particle.y, particle.color, 4);
    }

    // Handle multistage trigger
    if (particle.multistage && !particle.hasTriggered && particle.life < particle.stageTime) {
      particle.hasTriggered = true;
      this.createMiniExplosion(particle.x, particle.y, this.getColor(), 8);
    }

    return particle.life <= 0;
  },

  createMiniExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 0.8,
        decay: 0.03,
        size: 1.5,
        trail: []
      });
    }
  },

  drawParticle(particle) {
    const ctx = this.ctx;

    // Draw trail
    for (let i = 0; i < particle.trail.length; i++) {
      const t = particle.trail[i];
      const trailAlpha = (i / particle.trail.length) * t.life * 0.5;
      const trailSize = particle.size * (i / particle.trail.length) * 0.8;

      ctx.fillStyle = particle.color.replace(')', `, ${trailAlpha})`).replace('hsl', 'hsla');
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw main particle
    const alpha = particle.life;
    ctx.save();
    ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  animate(timestamp = 0) {
    // Fade effect for trails
    this.ctx.globalAlpha = 0.15;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;

    // Launch rockets based on frequency
    const launchInterval = 1000 / (this.launchFrequency / 2);
    if (timestamp - this.lastLaunchTime > launchInterval) {
      this.launchRocket();
      this.lastLaunchTime = timestamp;
    }

    // Update and draw rockets
    this.rockets = this.rockets.filter(rocket => {
      const exploded = this.updateRocket(rocket);
      if (exploded) {
        this.explode(rocket);
        return false;
      }
      this.drawRocket(rocket);
      return true;
    });

    // Update and draw particles
    this.particles = this.particles.filter(particle => {
      const dead = this.updateParticle(particle);
      if (!dead) {
        this.drawParticle(particle);
      }
      return !dead;
    });

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  },

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (!this.fixedWidth) {
      window.removeEventListener('resize', this.handleResize);
    }
    this.rockets = [];
    this.particles = [];
  }
};

if (typeof window !== 'undefined') {
  window.PyroScreensaver = PyroScreensaver;
}
