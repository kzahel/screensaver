// Cars3 - Race Track Screensaver
// Top-down view of race cars zooming around an oval track with trails

const Cars3Screensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Collections
  cars: [],
  confetti: [],

  // Track dimensions (calculated on resize)
  trackCenterX: 0,
  trackCenterY: 0,
  trackRadiusX: 0,
  trackRadiusY: 0,
  trackWidth: 60,

  // Resolution-independent scale factor (calculated in resize)
  baseScale: 1,

  // Configuration
  carCount: 5,
  speedSetting: 'racing',
  trailLength: 30,
  showConfetti: true,
  targetFps: 60,
  maxFramerate: 0,

  // Bright race car colors
  CAR_COLORS: [
    '#FF3B30', // Red
    '#007AFF', // Blue
    '#34C759', // Green
    '#FFCC00', // Yellow
    '#AF52DE', // Purple
    '#FF9500', // Orange
    '#5AC8FA', // Cyan
    '#FF2D55', // Pink
  ],

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Reset state
    this.cars = [];
    this.confetti = [];
    this.lastFrameTime = 0;

    // Apply settings (types are automatically parsed by OptionsGenerator/Registry)
    this.carCount = options.carCount ?? 5;
    this.speedSetting = options.speed ?? 'racing';
    this.trailLength = options.trailLength ?? 30;
    this.showConfetti = options.showConfetti ?? true;
    this.maxFramerate = options.maxFramerate ?? 0;

    // Preview mode support - only use fixed dimensions if canvas is explicitly passed
    // (this distinguishes preview mode from fullscreen with saved settings)
    if (options.canvas && options.width && options.height) {
      this.fixedWidth = options.width;
      this.fixedHeight = options.height;
    } else {
      this.fixedWidth = null;
      this.fixedHeight = null;
    }

    // Scale down for small preview
    if (this.fixedWidth && this.fixedWidth < 600) {
      this.carCount = Math.max(2, Math.floor(this.carCount / 2));
      this.trailLength = Math.floor(this.trailLength / 2);
    }

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear to green (grass)
    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.initCars();
    this.animate();
  },

  handleResize: function() {
    if (window.Cars3Screensaver && !window.Cars3Screensaver.fixedWidth) {
      window.Cars3Screensaver.resize();
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

    // Calculate track dimensions
    this.trackCenterX = this.canvas.width / 2;
    this.trackCenterY = this.canvas.height / 2;
    this.trackRadiusX = this.canvas.width * 0.4;
    this.trackRadiusY = this.canvas.height * 0.35;
    this.trackWidth = Math.min(this.canvas.width, this.canvas.height) * 0.08;
    // Calculate resolution-independent scale factor (800px is reference size)
    this.baseScale = Math.min(this.canvas.width, this.canvas.height) / 800;
  },

  getBaseSpeed() {
    switch (this.speedSetting) {
      case 'cruising': return 0.008;
      case 'racing': return 0.015;
      case 'turbo': return 0.025;
      default: return 0.015;
    }
  },

  initCars() {
    const baseSpeed = this.getBaseSpeed();

    for (let i = 0; i < this.carCount; i++) {
      // Distribute cars evenly around the track
      const startAngle = (Math.PI * 2 / this.carCount) * i;

      this.cars.push({
        angle: startAngle,
        speed: baseSpeed * (0.85 + Math.random() * 0.3), // Slight speed variation
        color: this.CAR_COLORS[i % this.CAR_COLORS.length],
        number: Math.floor(Math.random() * 99) + 1,
        trail: [],
        lastFinishCross: -Math.PI // Track when car last crossed finish line
      });
    }
  },

  getCarPosition(angle) {
    return {
      x: this.trackCenterX + Math.cos(angle) * this.trackRadiusX,
      y: this.trackCenterY + Math.sin(angle) * this.trackRadiusY
    };
  },

  updateCar(car, delta) {
    const prevAngle = car.angle;

    // Update angle (position on track)
    car.angle += car.speed * delta;

    // Wrap angle
    if (car.angle > Math.PI * 2) {
      car.angle -= Math.PI * 2;
    }

    // Check for finish line crossing (at angle 0)
    // Going from negative (or large positive near 2π) to small positive
    const justCrossed = (prevAngle > Math.PI * 1.5 && car.angle < Math.PI * 0.5);

    if (justCrossed && this.showConfetti && car.angle !== car.lastFinishCross) {
      this.spawnConfetti(car);
      car.lastFinishCross = car.angle;
    }

    // Update trail
    const pos = this.getCarPosition(car.angle);
    car.trail.push({ x: pos.x, y: pos.y, angle: car.angle });

    // Limit trail length
    while (car.trail.length > this.trailLength) {
      car.trail.shift();
    }
  },

  spawnConfetti(car) {
    const pos = this.getCarPosition(car.angle);
    const s = this.baseScale;

    for (let i = 0; i < 20; i++) {
      this.confetti.push({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - 0.5) * 8 * s,
        vy: (Math.random() - 0.5) * 8 * s - 3 * s,
        color: this.CAR_COLORS[Math.floor(Math.random() * this.CAR_COLORS.length)],
        size: (3 + Math.random() * 4) * s,
        life: 1,
        decay: 0.02 + Math.random() * 0.01,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
      });
    }
  },

  updateConfetti(delta) {
    const s = this.baseScale;
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx * delta;
      c.y += c.vy * delta;
      c.vy += 0.2 * s * delta; // Gravity (scaled)
      c.rotation += c.rotationSpeed * delta;
      c.life -= c.decay * delta;

      if (c.life <= 0) {
        this.confetti.splice(i, 1);
      }
    }
  },

  drawTrack() {
    const ctx = this.ctx;

    // Grass background
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Track surface (dark gray)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = this.trackWidth;
    ctx.beginPath();
    ctx.ellipse(
      this.trackCenterX,
      this.trackCenterY,
      this.trackRadiusX,
      this.trackRadiusY,
      0, 0, Math.PI * 2
    );
    ctx.stroke();

    // Inner grass (green center)
    ctx.fillStyle = '#2E8B2E';
    ctx.beginPath();
    ctx.ellipse(
      this.trackCenterX,
      this.trackCenterY,
      this.trackRadiusX - this.trackWidth / 2,
      this.trackRadiusY - this.trackWidth / 2,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Track edge lines (white)
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;

    // Outer edge
    ctx.beginPath();
    ctx.ellipse(
      this.trackCenterX,
      this.trackCenterY,
      this.trackRadiusX + this.trackWidth / 2 - 2,
      this.trackRadiusY + this.trackWidth / 2 - 2,
      0, 0, Math.PI * 2
    );
    ctx.stroke();

    // Inner edge
    ctx.beginPath();
    ctx.ellipse(
      this.trackCenterX,
      this.trackCenterY,
      this.trackRadiusX - this.trackWidth / 2 + 2,
      this.trackRadiusY - this.trackWidth / 2 + 2,
      0, 0, Math.PI * 2
    );
    ctx.stroke();

    // Dashed center line
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.ellipse(
      this.trackCenterX,
      this.trackCenterY,
      this.trackRadiusX,
      this.trackRadiusY,
      0, 0, Math.PI * 2
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Finish line (checkered pattern)
    this.drawFinishLine();
  },

  drawFinishLine() {
    const ctx = this.ctx;
    const s = this.baseScale;
    const finishX = this.trackCenterX + this.trackRadiusX;
    const finishY = this.trackCenterY;
    const lineWidth = this.trackWidth;
    const lineHeight = 20 * s;
    const squareSize = 10 * s;

    ctx.save();
    ctx.translate(finishX, finishY);

    // Draw checkered pattern
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < Math.ceil(lineWidth / squareSize); col++) {
        const isBlack = (row + col) % 2 === 0;
        ctx.fillStyle = isBlack ? '#000' : '#FFF';
        ctx.fillRect(
          -lineWidth / 2 + col * squareSize,
          -lineHeight / 2 + row * squareSize,
          squareSize,
          squareSize
        );
      }
    }

    ctx.restore();
  },

  drawTrail(car) {
    const ctx = this.ctx;
    const trail = car.trail;
    const s = this.baseScale; // Scale factor for resolution independence

    if (trail.length < 2) return;

    for (let i = 1; i < trail.length; i++) {
      const t = trail[i];
      const alpha = (i / trail.length) * 0.7;
      const width = ((i / trail.length) * 8 + 2) * s;

      ctx.strokeStyle = car.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');

      // Convert hex to rgba for alpha support
      const hex = car.color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

      ctx.lineWidth = width;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }
  },

  drawCar(car) {
    const ctx = this.ctx;
    const pos = this.getCarPosition(car.angle);
    const s = this.baseScale; // Scale factor for resolution independence

    // Calculate car rotation (tangent to the ellipse)
    // Derivative of ellipse: dx/dθ = -a*sin(θ), dy/dθ = b*cos(θ)
    const dx = -Math.sin(car.angle) * this.trackRadiusX;
    const dy = Math.cos(car.angle) * this.trackRadiusY;
    const rotation = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);

    const carLength = 24 * s;
    const carWidth = 14 * s;

    // Car body
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, 3 * s);
    ctx.fill();

    // Darker outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Spoiler (back of car)
    ctx.fillStyle = '#222';
    ctx.fillRect(-carLength / 2 - 2 * s, -carWidth / 2 + 2 * s, 4 * s, carWidth - 4 * s);

    // Windshield
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(2 * s, -carWidth / 2 + 3 * s, 8 * s, carWidth - 6 * s, 2 * s);
    ctx.fill();

    // Racing number on roof
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(0, 0, 5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.round(7 * s)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(car.number.toString(), 0, 0);

    // Headlights
    ctx.fillStyle = '#FFFF88';
    ctx.beginPath();
    ctx.arc(carLength / 2 - 2 * s, -carWidth / 4, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carLength / 2 - 2 * s, carWidth / 4, 2 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawConfetti() {
    const ctx = this.ctx;

    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.globalAlpha = c.life;
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
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

    const deltaTime = this.lastFrameTime ? (timestamp - this.lastFrameTime) : 16.67;
    this.lastFrameTime = timestamp;
    const delta = deltaTime / (1000 / this.targetFps);

    // Draw track (clears background too)
    this.drawTrack();

    // Update and draw cars
    for (const car of this.cars) {
      this.updateCar(car, delta);
    }

    // Draw trails first (behind cars)
    for (const car of this.cars) {
      this.drawTrail(car);
    }

    // Draw cars on top
    for (const car of this.cars) {
      this.drawCar(car);
    }

    // Update and draw confetti
    this.updateConfetti(delta);
    this.drawConfetti();

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
    this.cars = [];
    this.confetti = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.Cars3Screensaver = Cars3Screensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('cars3', {
      name: 'Race Track',
      module: Cars3Screensaver,
      canvas: true,
      options: {
        carCount: {
          type: 'select',
          label: 'Number of Cars',
          default: 5,
          values: [3, 5, 8],
          labels: ['3 Cars', '5 Cars', '8 Cars']
        },
        speed: {
          type: 'select',
          label: 'Race Speed',
          default: 'racing',
          values: ['cruising', 'racing', 'turbo'],
          labels: ['Cruising', 'Racing', 'Turbo!']
        },
        trailLength: {
          type: 'range',
          label: 'Trail Length',
          default: 30,
          min: 10,
          max: 50
        },
        showConfetti: {
          type: 'checkbox',
          label: 'Finish Line Confetti',
          default: true
        }
      }
    });
  }
}
