// Cars1 - Bouncing Cars Screensaver
// Colorful vehicles bouncing around the screen like the DVD logo

const Cars1Screensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Collections
  vehicles: [],

  // Resolution-independent scale factor (calculated in resize)
  baseScale: 1,

  // Configuration
  vehicleCount: 8,
  speed: 2,
  colorChange: true,
  targetFps: 60,
  maxFramerate: 0,

  // Light flash timing
  lightTimer: 0,
  lightsOn: false,

  // Bright toddler-friendly colors (hue values)
  COLORS: [0, 30, 50, 120, 200, 270, 330, 190], // Red, Orange, Yellow, Green, Blue, Purple, Pink, Cyan

  // Vehicle types
  VEHICLE_TYPES: ['sedan', 'truck', 'bus', 'firetruck', 'police'],

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Reset state
    this.vehicles = [];
    this.lastFrameTime = 0;
    this.lightTimer = 0;
    this.lightsOn = false;

    // Apply settings (types are automatically parsed by OptionsGenerator/Registry)
    this.vehicleCount = options.vehicleCount ?? 8;
    this.speed = options.speed ?? 2;
    this.colorChange = options.colorChange ?? true;
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
      this.vehicleCount = Math.max(2, Math.floor(this.vehicleCount / 2));
    }

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.initVehicles();
    this.animate();
  },

  handleResize: function() {
    if (window.Cars1Screensaver && !window.Cars1Screensaver.fixedWidth) {
      window.Cars1Screensaver.resize();
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
    // Calculate resolution-independent scale factor (800px is reference size)
    this.baseScale = Math.min(this.canvas.width, this.canvas.height) / 800;
  },

  initVehicles() {
    for (let i = 0; i < this.vehicleCount; i++) {
      this.vehicles.push(this.createVehicle());
    }
  },

  createVehicle() {
    const type = this.VEHICLE_TYPES[Math.floor(Math.random() * this.VEHICLE_TYPES.length)];
    const scale = 0.8 + Math.random() * 0.6; // 0.8 to 1.4
    const baseSpeed = this.speed * (0.5 + Math.random() * 0.5);

    // Random angle for initial direction
    const angle = Math.random() * Math.PI * 2;

    return {
      x: Math.random() * (this.canvas.width - 100) + 50,
      y: Math.random() * (this.canvas.height - 60) + 30,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      type: type,
      hue: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      wheelRotation: 0,
      scale: scale,
      // Smooth rotation: current rotation angle
      rotation: Math.atan2(Math.sin(angle), Math.cos(angle)),
      // Target rotation (where we want to face)
      targetRotation: Math.atan2(Math.sin(angle), Math.cos(angle))
    };
  },

  // Normalize angle to -PI to PI range
  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  },

  // Smooth rotation interpolation
  lerpAngle(current, target, t) {
    let diff = this.normalizeAngle(target - current);
    return current + diff * t;
  },

  updateVehicle(vehicle, delta) {
    // Update position
    vehicle.x += vehicle.vx * delta;
    vehicle.y += vehicle.vy * delta;

    // Update wheel rotation based on speed
    const speed = Math.sqrt(vehicle.vx * vehicle.vx + vehicle.vy * vehicle.vy);
    vehicle.wheelRotation += speed * delta * 0.3;

    // Get vehicle dimensions for collision
    const width = this.getVehicleWidth(vehicle.type) * vehicle.scale;
    const height = this.getVehicleHeight(vehicle.type) * vehicle.scale;

    // Bounce off edges
    let bounced = false;

    if (vehicle.x - width/2 <= 0) {
      vehicle.x = width/2;
      vehicle.vx = Math.abs(vehicle.vx);
      bounced = true;
    } else if (vehicle.x + width/2 >= this.canvas.width) {
      vehicle.x = this.canvas.width - width/2;
      vehicle.vx = -Math.abs(vehicle.vx);
      bounced = true;
    }

    if (vehicle.y - height/2 <= 0) {
      vehicle.y = height/2;
      vehicle.vy = Math.abs(vehicle.vy);
      bounced = true;
    } else if (vehicle.y + height/2 >= this.canvas.height) {
      vehicle.y = this.canvas.height - height/2;
      vehicle.vy = -Math.abs(vehicle.vy);
      bounced = true;
    }

    // Update target rotation based on velocity direction
    vehicle.targetRotation = Math.atan2(vehicle.vy, vehicle.vx);

    // Smoothly interpolate current rotation towards target
    // Faster turning when bouncing, slower during normal movement
    const turnSpeed = bounced ? 0.15 : 0.08;
    vehicle.rotation = this.lerpAngle(vehicle.rotation, vehicle.targetRotation, turnSpeed * delta);

    // Color change on bounce (for non-emergency vehicles)
    if (bounced && this.colorChange && vehicle.type !== 'firetruck' && vehicle.type !== 'police') {
      vehicle.hue = (vehicle.hue + 60) % 360;
    }
  },

  getVehicleWidth(type) {
    const base = (() => {
      switch (type) {
        case 'bus': return 120;
        case 'firetruck': return 100;
        case 'truck': return 80;
        default: return 70;
      }
    })();
    return base * this.baseScale;
  },

  getVehicleHeight(type) {
    return 40 * this.baseScale;
  },

  // Draw a simple wheel with hubcap
  drawWheel(x, y, radius, rotation) {
    const ctx = this.ctx;

    // Tire
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hubcap
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Hubcap detail (spinning line)
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(rotation) * radius * 0.5, y + Math.sin(rotation) * radius * 0.5);
    ctx.stroke();
  },

  drawSedan(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, rotation } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const bodyColor = `hsl(${hue}, 80%, 50%)`;

    // Car body (main)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.fill();

    // Cabin/roof
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-15 * s, -20 * s, 35 * s, 14 * s, 3 * s);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(-12 * s, -18 * s, 14 * s, 10 * s, 2 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(5 * s, -18 * s, 12 * s, 10 * s, 2 * s);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.stroke();

    // Headlight
    ctx.fillStyle = '#FFFF88';
    ctx.beginPath();
    ctx.arc(28 * s, 2 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Taillight
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(-28 * s, 2 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Wheels (relative to car body)
    this.drawWheel(-18 * s, 12 * s, 10 * s, wheelRotation);
    this.drawWheel(18 * s, 12 * s, 10 * s, wheelRotation);

    ctx.restore();
  },

  drawTruck(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, rotation } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const bodyColor = `hsl(${hue}, 80%, 50%)`;

    // Truck bed
    ctx.fillStyle = `hsl(${hue}, 60%, 40%)`;
    ctx.beginPath();
    ctx.roundRect(-35 * s, -5 * s, 40 * s, 20 * s, 2 * s);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Cab
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(5 * s, -18 * s, 30 * s, 33 * s, 4 * s);
    ctx.fill();
    ctx.stroke();

    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(10 * s, -14 * s, 20 * s, 12 * s, 2 * s);
    ctx.fill();

    // Headlight
    ctx.fillStyle = '#FFFF88';
    ctx.beginPath();
    ctx.arc(33 * s, 5 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    this.drawWheel(-22 * s, 12 * s, 10 * s, wheelRotation);
    this.drawWheel(22 * s, 12 * s, 10 * s, wheelRotation);

    ctx.restore();
  },

  drawBus(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, rotation } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const bodyColor = `hsl(${hue}, 80%, 50%)`;

    // Bus body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-55 * s, -18 * s, 110 * s, 35 * s, 5 * s);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Windows
    ctx.fillStyle = '#87CEEB';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.roundRect((-45 + i * 20) * s, -14 * s, 14 * s, 12 * s, 2 * s);
      ctx.fill();
    }

    // Door
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.roundRect(42 * s, -14 * s, 10 * s, 26 * s, 2 * s);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#FFFF88';
    ctx.beginPath();
    ctx.arc(52 * s, 8 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(-52 * s, 8 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Wheels (4 for bus)
    this.drawWheel(-35 * s, 14 * s, 10 * s, wheelRotation);
    this.drawWheel(-15 * s, 14 * s, 10 * s, wheelRotation);
    this.drawWheel(15 * s, 14 * s, 10 * s, wheelRotation);
    this.drawWheel(35 * s, 14 * s, 10 * s, wheelRotation);

    ctx.restore();
  },

  drawFireTruck(vehicle) {
    const ctx = this.ctx;
    const { x, y, wheelRotation, rotation } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Main body - bright red
    ctx.fillStyle = '#FF2222';
    ctx.beginPath();
    ctx.roundRect(-45 * s, -8 * s, 90 * s, 25 * s, 4 * s);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Cab
    ctx.fillStyle = '#FF2222';
    ctx.beginPath();
    ctx.roundRect(25 * s, -22 * s, 25 * s, 35 * s, 4 * s);
    ctx.fill();
    ctx.stroke();

    // Cab window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(28 * s, -18 * s, 18 * s, 12 * s, 2 * s);
    ctx.fill();

    // Ladder (silver bars)
    ctx.fillStyle = '#CCC';
    ctx.fillRect(-40 * s, -12 * s, 60 * s, 4 * s);
    ctx.fillRect(-40 * s, -6 * s, 60 * s, 4 * s);
    // Ladder rungs
    ctx.fillStyle = '#AAA';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect((-35 + i * 12) * s, -12 * s, 3 * s, 10 * s);
    }

    // Emergency light on top
    ctx.fillStyle = this.lightsOn ? '#FF0000' : '#880000';
    ctx.beginPath();
    ctx.arc(35 * s, -26 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    // Light glow when on
    if (this.lightsOn) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(35 * s, -26 * s, 12 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wheels
    this.drawWheel(-32 * s, 14 * s, 10 * s, wheelRotation);
    this.drawWheel(32 * s, 14 * s, 10 * s, wheelRotation);

    ctx.restore();
  },

  drawPoliceCar(vehicle) {
    const ctx = this.ctx;
    const { x, y, wheelRotation, rotation } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Car body - black and white
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.fill();

    // White front
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(5 * s, -8 * s, 25 * s, 24 * s, 4 * s);
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(-15 * s, -20 * s, 35 * s, 14 * s, 3 * s);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(-12 * s, -18 * s, 14 * s, 10 * s, 2 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(5 * s, -18 * s, 12 * s, 10 * s, 2 * s);
    ctx.fill();

    // Light bar
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.roundRect(-8 * s, -26 * s, 20 * s, 6 * s, 2 * s);
    ctx.fill();

    // Red and blue lights
    ctx.fillStyle = this.lightsOn ? '#FF0000' : '#880000';
    ctx.beginPath();
    ctx.arc(-3 * s, -23 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.lightsOn ? '#0066FF' : '#003388';
    ctx.beginPath();
    ctx.arc(7 * s, -23 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    // Light glow when on
    if (this.lightsOn) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(-3 * s, -23 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(7 * s, -23 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.stroke();

    // Wheels
    this.drawWheel(-18 * s, 12 * s, 10 * s, wheelRotation);
    this.drawWheel(18 * s, 12 * s, 10 * s, wheelRotation);

    ctx.restore();
  },

  drawVehicle(vehicle) {
    switch (vehicle.type) {
      case 'sedan':
        this.drawSedan(vehicle);
        break;
      case 'truck':
        this.drawTruck(vehicle);
        break;
      case 'bus':
        this.drawBus(vehicle);
        break;
      case 'firetruck':
        this.drawFireTruck(vehicle);
        break;
      case 'police':
        this.drawPoliceCar(vehicle);
        break;
    }
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

    // Delta multiplier: 1.0 at 60fps
    const delta = deltaTime / (1000 / this.targetFps);

    // Update light flash timer
    this.lightTimer += deltaTime;
    if (this.lightTimer > 300) { // Flash every 300ms
      this.lightsOn = !this.lightsOn;
      this.lightTimer = 0;
    }

    // Clear to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw vehicles
    for (const vehicle of this.vehicles) {
      this.updateVehicle(vehicle, delta);
      this.drawVehicle(vehicle);
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
    this.vehicles = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.Cars1Screensaver = Cars1Screensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('cars1', {
      name: 'Bouncing Cars',
      module: Cars1Screensaver,
      canvas: true,
      options: {
        vehicleCount: {
          type: 'range',
          label: 'Number of Vehicles',
          default: 8,
          min: 3,
          max: 15
        },
        speed: {
          type: 'range',
          label: 'Speed',
          default: 2,
          min: 1,
          max: 5
        },
        colorChange: {
          type: 'checkbox',
          label: 'Change Color on Bounce',
          default: true
        }
      }
    });
  }
}
