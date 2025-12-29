const FlyingToastersScreensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Collections
  toasters: [],
  toasts: [],

  // Configuration
  toasterCount: 8,
  toastCount: 6,
  speed: 2,
  targetFps: 60, // Base speed calibrated to 60fps
  maxFramerate: 0, // 0 = unlimited, or limit to 20/30/60
  direction: 'diagonal-down-left',
  toastDarkness: 'mixed',

  // Direction vectors
  directionVector: { dx: -1, dy: 1 },
  DIRECTIONS: {
    'diagonal-down-left': { dx: -1, dy: 1 },
    'diagonal-down-right': { dx: 1, dy: 1 },
    'diagonal-up-left': { dx: -1, dy: -1 },
    'diagonal-up-right': { dx: 1, dy: -1 }
  },

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Reset state
    this.toasters = [];
    this.toasts = [];
    this.lastFrameTime = 0;

    // Apply settings
    this.toasterCount = options.toasterCount || 8;
    this.toastCount = options.toastCount || 6;
    this.speed = options.speed || 2;
    this.maxFramerate = options.maxFramerate || 0;
    this.direction = options.direction || 'diagonal-down-left';
    this.toastDarkness = options.toastDarkness || 'mixed';
    this.directionVector = this.DIRECTIONS[this.direction];

    // Preview mode support
    this.fixedWidth = options.width || null;
    this.fixedHeight = options.height || null;

    // Scale down for small preview
    if (this.fixedWidth && this.fixedWidth < 600) {
      this.toasterCount = Math.max(2, Math.floor(this.toasterCount / 2));
      this.toastCount = Math.max(1, Math.floor(this.toastCount / 2));
    }

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.initObjects();
    this.animate();
  },

  handleResize: function() {
    if (window.FlyingToastersScreensaver.canvas && !window.FlyingToastersScreensaver.fixedWidth) {
      window.FlyingToastersScreensaver.resize();
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

  initObjects() {
    // Create toasters scattered across screen
    for (let i = 0; i < this.toasterCount; i++) {
      this.toasters.push(this.createToaster(true));
    }
    // Create toast
    for (let i = 0; i < this.toastCount; i++) {
      this.toasts.push(this.createToast(true));
    }
  },

  createToaster(randomPosition = false) {
    const scale = 0.6 + Math.random() * 0.6; // 0.6 to 1.2
    let x, y;

    if (randomPosition) {
      x = Math.random() * this.canvas.width;
      y = Math.random() * this.canvas.height;
    } else {
      // Spawn at edge based on direction
      // Randomly choose to spawn from horizontal or vertical edge
      const spawnFromHorizontalEdge = Math.random() < 0.5;

      if (spawnFromHorizontalEdge) {
        // Spawn from top or bottom edge (full width)
        x = Math.random() * (this.canvas.width + 200) - 100;
        if (this.directionVector.dy > 0) {
          y = -50 - Math.random() * 50;
        } else {
          y = this.canvas.height + 50 + Math.random() * 50;
        }
      } else {
        // Spawn from left or right edge (full height)
        y = Math.random() * (this.canvas.height + 200) - 100;
        if (this.directionVector.dx < 0) {
          x = this.canvas.width + 50 + Math.random() * 50;
        } else {
          x = -50 - Math.random() * 50;
        }
      }
    }

    return {
      x: x,
      y: y,
      scale: scale,
      speed: 0.8 + Math.random() * 0.4, // Individual speed variation
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 0.15 + Math.random() * 0.1
    };
  },

  createToast(randomPosition = false) {
    const scale = 0.5 + Math.random() * 0.5;
    let x, y;

    if (randomPosition) {
      x = Math.random() * this.canvas.width;
      y = Math.random() * this.canvas.height;
    } else {
      // Randomly choose to spawn from horizontal or vertical edge
      const spawnFromHorizontalEdge = Math.random() < 0.5;

      if (spawnFromHorizontalEdge) {
        x = Math.random() * (this.canvas.width + 100) - 50;
        if (this.directionVector.dy > 0) {
          y = -30 - Math.random() * 40;
        } else {
          y = this.canvas.height + 30 + Math.random() * 40;
        }
      } else {
        y = Math.random() * (this.canvas.height + 100) - 50;
        if (this.directionVector.dx < 0) {
          x = this.canvas.width + 30 + Math.random() * 40;
        } else {
          x = -30 - Math.random() * 40;
        }
      }
    }

    let doneness;
    switch (this.toastDarkness) {
      case 'light': doneness = 0.1 + Math.random() * 0.2; break;
      case 'medium': doneness = 0.3 + Math.random() * 0.3; break;
      case 'dark': doneness = 0.6 + Math.random() * 0.4; break;
      case 'mixed':
      default: doneness = Math.random(); break;
    }

    return {
      x: x,
      y: y,
      scale: scale,
      speed: 0.7 + Math.random() * 0.5,
      rotation: (Math.random() - 0.5) * 0.3,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      doneness: doneness
    };
  },

  updateToaster(toaster, delta = 1) {
    toaster.x += this.directionVector.dx * toaster.speed * this.speed * delta;
    toaster.y += this.directionVector.dy * toaster.speed * this.speed * delta;
    toaster.wingPhase += toaster.wingSpeed * delta;

    // Check if off screen and needs respawn
    const margin = 100;
    let offScreen = false;

    if (this.directionVector.dx < 0 && toaster.x < -margin) offScreen = true;
    if (this.directionVector.dx > 0 && toaster.x > this.canvas.width + margin) offScreen = true;
    if (this.directionVector.dy > 0 && toaster.y > this.canvas.height + margin) offScreen = true;
    if (this.directionVector.dy < 0 && toaster.y < -margin) offScreen = true;

    if (offScreen) {
      const newToaster = this.createToaster(false);
      toaster.x = newToaster.x;
      toaster.y = newToaster.y;
      toaster.scale = newToaster.scale;
      toaster.speed = newToaster.speed;
      toaster.wingPhase = newToaster.wingPhase;
      toaster.wingSpeed = newToaster.wingSpeed;
    }
  },

  updateToast(toast, delta = 1) {
    toast.x += this.directionVector.dx * toast.speed * this.speed * delta;
    toast.y += this.directionVector.dy * toast.speed * this.speed * delta;
    toast.rotation += toast.rotationSpeed * delta;

    const margin = 60;
    let offScreen = false;

    if (this.directionVector.dx < 0 && toast.x < -margin) offScreen = true;
    if (this.directionVector.dx > 0 && toast.x > this.canvas.width + margin) offScreen = true;
    if (this.directionVector.dy > 0 && toast.y > this.canvas.height + margin) offScreen = true;
    if (this.directionVector.dy < 0 && toast.y < -margin) offScreen = true;

    if (offScreen) {
      const newToast = this.createToast(false);
      toast.x = newToast.x;
      toast.y = newToast.y;
      toast.scale = newToast.scale;
      toast.speed = newToast.speed;
      toast.rotation = newToast.rotation;
      toast.rotationSpeed = newToast.rotationSpeed;
      toast.doneness = newToast.doneness;
    }
  },

  drawToasterBody(x, y, scale) {
    const ctx = this.ctx;
    const width = 60 * scale;
    const height = 45 * scale;

    ctx.save();
    ctx.translate(x, y);

    // Chrome gradient for metallic look
    const bodyGradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
    bodyGradient.addColorStop(0, '#555');
    bodyGradient.addColorStop(0.2, '#999');
    bodyGradient.addColorStop(0.4, '#ddd');
    bodyGradient.addColorStop(0.5, '#fff');
    bodyGradient.addColorStop(0.6, '#ddd');
    bodyGradient.addColorStop(0.8, '#999');
    bodyGradient.addColorStop(1, '#666');

    // Main body
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(-width/2, -height/2, width, height, 6 * scale);
    ctx.fill();

    // Darker outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Bread slots on top
    const slotWidth = 18 * scale;
    const slotHeight = 6 * scale;
    const slotY = -height/2 + 5 * scale;

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(-slotWidth - 4 * scale, slotY, slotWidth, slotHeight, 2 * scale);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(4 * scale, slotY, slotWidth, slotHeight, 2 * scale);
    ctx.fill();

    // Handle/lever on right side
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.roundRect(width/2 - 2 * scale, -8 * scale, 6 * scale, 16 * scale, 2 * scale);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // Base/feet
    ctx.fillStyle = '#333';
    ctx.fillRect(-width/2 + 8 * scale, height/2 - 2 * scale, 12 * scale, 4 * scale);
    ctx.fillRect(width/2 - 20 * scale, height/2 - 2 * scale, 12 * scale, 4 * scale);

    ctx.restore();
  },

  drawWing(x, y, scale, angle, flipped) {
    const ctx = this.ctx;
    const wingLength = 45 * scale;
    const wingWidth = 20 * scale;

    ctx.save();
    ctx.translate(x, y);

    if (flipped) {
      ctx.scale(-1, 1);
    }

    // Rotate for flapping
    ctx.rotate(angle);

    // Wing base color
    ctx.fillStyle = '#f5f5f5';

    // Main wing shape
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingLength * 0.4, -wingWidth * 0.7, wingLength, -wingWidth * 0.3);
    ctx.lineTo(wingLength * 0.95, wingWidth * 0.1);
    ctx.quadraticCurveTo(wingLength * 0.4, wingWidth * 0.4, 0, wingWidth * 0.15);
    ctx.closePath();
    ctx.fill();

    // Wing outline
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // Feather details
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.8 * scale;
    for (let i = 1; i <= 4; i++) {
      const fx = wingLength * 0.15 * i;
      ctx.beginPath();
      ctx.moveTo(fx, -wingWidth * 0.1 * i);
      ctx.lineTo(fx + wingLength * 0.12, -wingWidth * 0.25 - wingWidth * 0.05 * i);
      ctx.stroke();
    }

    ctx.restore();
  },

  drawToaster(toaster) {
    const wingAngle = Math.sin(toaster.wingPhase) * (Math.PI / 5); // -36 to +36 degrees
    const wingOffsetY = Math.sin(toaster.wingPhase) * 3 * toaster.scale;

    // Draw wings behind body
    // Left wing
    this.drawWing(
      toaster.x - 28 * toaster.scale,
      toaster.y - 5 * toaster.scale + wingOffsetY,
      toaster.scale,
      wingAngle - 0.2,
      true
    );
    // Right wing
    this.drawWing(
      toaster.x + 28 * toaster.scale,
      toaster.y - 5 * toaster.scale + wingOffsetY,
      toaster.scale,
      -wingAngle + 0.2,
      false
    );

    // Draw toaster body
    this.drawToasterBody(toaster.x, toaster.y, toaster.scale);
  },

  drawToast(toast) {
    const ctx = this.ctx;
    const width = 28 * toast.scale;
    const height = 32 * toast.scale;

    ctx.save();
    ctx.translate(toast.x, toast.y);
    ctx.rotate(toast.rotation);

    // Base bread color based on doneness
    const r = Math.floor(245 - toast.doneness * 90);
    const g = Math.floor(215 - toast.doneness * 120);
    const b = Math.floor(175 - toast.doneness * 140);

    // Toast body
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.roundRect(-width/2, -height/2, width, height, 4 * toast.scale);
    ctx.fill();

    // Crust (darker edge)
    ctx.strokeStyle = `rgb(${r - 50}, ${g - 50}, ${b - 50})`;
    ctx.lineWidth = 2.5 * toast.scale;
    ctx.stroke();

    // Slight highlight on top edge
    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.lineWidth = 1 * toast.scale;
    ctx.beginPath();
    ctx.moveTo(-width/2 + 4 * toast.scale, -height/2 + 2 * toast.scale);
    ctx.lineTo(width/2 - 4 * toast.scale, -height/2 + 2 * toast.scale);
    ctx.stroke();

    ctx.restore();
  },

  animate(timestamp = 0) {
    // Framerate limiting
    if (this.maxFramerate > 0 && this.lastFrameTime) {
      const minFrameTime = 1000 / this.maxFramerate;
      if (timestamp - this.lastFrameTime < minFrameTime) {
        this.animationId = requestAnimationFrame((t) => this.animate(t));
        return;
      }
    }

    // Calculate delta time for frame-rate independent movement
    const deltaTime = this.lastFrameTime ? (timestamp - this.lastFrameTime) : 16.67;
    this.lastFrameTime = timestamp;

    // Delta multiplier: 1.0 at 60fps, 0.5 at 120fps, etc.
    const delta = deltaTime / (1000 / this.targetFps);

    // Clear to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw toasts first (behind toasters)
    for (const toast of this.toasts) {
      this.updateToast(toast, delta);
      this.drawToast(toast);
    }

    // Update and draw toasters
    for (const toaster of this.toasters) {
      this.updateToaster(toaster, delta);
      this.drawToaster(toaster);
    }

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
    this.toasters = [];
    this.toasts = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.FlyingToastersScreensaver = FlyingToastersScreensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('flying-toasters', {
      name: 'Flying Toasters',
      module: FlyingToastersScreensaver,
      canvas: true,
      options: {
        toasterCount: {
          type: 'range',
          label: 'Number of Toasters',
          default: 8,
          min: 2,
          max: 20
        },
        toastCount: {
          type: 'range',
          label: 'Number of Toast',
          default: 6,
          min: 0,
          max: 15
        },
        speed: {
          type: 'range',
          label: 'Flight Speed',
          default: 2,
          min: 1,
          max: 8
        },
        direction: {
          type: 'select',
          label: 'Direction',
          default: 'diagonal-down-left',
          values: ['diagonal-down-left', 'diagonal-down-right', 'diagonal-up-left', 'diagonal-up-right'],
          labels: ['Down-Left (Classic)', 'Down-Right', 'Up-Left', 'Up-Right']
        },
        toastDarkness: {
          type: 'select',
          label: 'Toast Doneness',
          default: 'mixed',
          values: ['light', 'medium', 'dark', 'mixed'],
          labels: ['Light', 'Medium', 'Dark', 'Mixed']
        }
      }
    });
  }
}
