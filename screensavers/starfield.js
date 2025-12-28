const StarfieldScreensaver = {
  canvas: null,
  ctx: null,
  stars: [],
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  centerX: 0,
  centerY: 0,

  // Configuration
  numStars: 200,
  speed: 5,
  maxDepth: 1000,
  focalLength: 256,

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];

    // Apply settings from options
    this.numStars = options.starDensity || 200;
    this.speed = options.warpSpeed || 5;

    // Preview mode support
    this.fixedWidth = options.width || null;
    this.fixedHeight = options.height || null;

    // Scale for preview
    if (this.fixedWidth && this.fixedWidth < 600) {
      this.numStars = Math.floor(this.numStars / 3);
      this.focalLength = 128;
    } else {
      this.focalLength = 256;
    }

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear canvas to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.initStars();
    this.animate();
  },

  handleResize: function() {
    if (window.StarfieldScreensaver.canvas && !window.StarfieldScreensaver.fixedWidth) {
      window.StarfieldScreensaver.resize();
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
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  },

  initStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push(this.createStar(true));
    }
  },

  createStar(randomDepth = false) {
    // Spread stars in a box around the center
    const spread = Math.max(this.canvas.width, this.canvas.height);
    return {
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: randomDepth ? Math.random() * this.maxDepth + 1 : this.maxDepth
    };
  },

  updateStar(star) {
    // Move star toward viewer
    star.z -= this.speed;

    // Respawn if too close
    if (star.z <= 1) {
      Object.assign(star, this.createStar(false));
      return;
    }

    // Check if off-screen
    const screenX = (star.x / star.z) * this.focalLength + this.centerX;
    const screenY = (star.y / star.z) * this.focalLength + this.centerY;

    if (screenX < -50 || screenX > this.canvas.width + 50 ||
        screenY < -50 || screenY > this.canvas.height + 50) {
      Object.assign(star, this.createStar(false));
    }
  },

  drawStar(star) {
    const ctx = this.ctx;

    // Current position
    const screenX = (star.x / star.z) * this.focalLength + this.centerX;
    const screenY = (star.y / star.z) * this.focalLength + this.centerY;

    // Previous position for streak
    const prevZ = star.z + this.speed;
    const prevScreenX = (star.x / prevZ) * this.focalLength + this.centerX;
    const prevScreenY = (star.y / prevZ) * this.focalLength + this.centerY;

    // Size and brightness based on depth (closer = bigger and brighter)
    const depthRatio = 1 - star.z / this.maxDepth;
    const size = Math.max(0.5, depthRatio * 3);
    const brightness = depthRatio;

    // Color: white with varying brightness
    const colorValue = Math.floor(155 + brightness * 100);
    ctx.strokeStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
    ctx.fillStyle = ctx.strokeStyle;

    // Draw streak (line from previous to current position) at higher speeds
    if (this.speed >= 3) {
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(prevScreenX, prevScreenY);
      ctx.lineTo(screenX, screenY);
      ctx.stroke();
    } else {
      // At low speeds, just draw a point
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  animate() {
    // Clear to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw all stars
    for (const star of this.stars) {
      this.updateStar(star);
      this.drawStar(star);
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  },

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (!this.fixedWidth) {
      window.removeEventListener('resize', this.handleResize);
    }
    this.stars = [];
  }
};

if (typeof window !== 'undefined') {
  window.StarfieldScreensaver = StarfieldScreensaver;
}
