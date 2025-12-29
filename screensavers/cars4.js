// Cars4 - Sky Highway Screensaver
// Scenic highway with cars, planes, and helicopters flying overhead

const Cars4Screensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Collections
  vehicles: [],
  aircraft: [],
  clouds: [],

  // Scene dimensions (calculated on resize)
  skyHeight: 0,
  grassTopY: 0,
  highwayY: 0,
  highwayHeight: 0,
  grassBottomY: 0,

  // Configuration
  carDensity: 'medium',
  aircraftFrequency: 'occasional',
  showClouds: true,
  speed: 2,
  targetFps: 60,
  maxFramerate: 0,

  // Timing
  lastVehicleSpawn: 0,
  lastAircraftSpawn: 0,
  propellerRotation: 0,
  rotorRotation: 0,

  // Bright toddler-friendly colors
  VEHICLE_COLORS: [
    '#FF3B30', // Red
    '#007AFF', // Blue
    '#34C759', // Green
    '#FFCC00', // Yellow
    '#AF52DE', // Purple
    '#FF9500', // Orange
    '#5AC8FA', // Cyan
    '#FF2D55', // Pink
  ],

  VEHICLE_TYPES: ['sedan', 'suv', 'truck', 'bus'],
  AIRCRAFT_TYPES: ['propPlane', 'jet', 'biplane', 'helicopter'],

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Reset state
    this.vehicles = [];
    this.aircraft = [];
    this.clouds = [];
    this.lastFrameTime = 0;
    this.lastVehicleSpawn = 0;
    this.lastAircraftSpawn = 0;
    this.propellerRotation = 0;
    this.rotorRotation = 0;

    // Apply settings
    this.carDensity = options.carDensity || 'medium';
    this.aircraftFrequency = options.aircraftFrequency || 'occasional';
    this.showClouds = options.showClouds !== undefined ? options.showClouds : true;
    this.speed = options.speed || 2;
    this.maxFramerate = options.maxFramerate || 0;

    // Preview mode support
    this.fixedWidth = options.width || null;
    this.fixedHeight = options.height || null;

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Initialize scene
    this.initClouds();
    this.initVehicles();
    this.initAircraft();

    this.animate();
  },

  handleResize: function() {
    if (window.Cars4Screensaver && !window.Cars4Screensaver.fixedWidth) {
      window.Cars4Screensaver.resize();
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

    // Calculate scene dimensions
    const h = this.canvas.height;
    this.skyHeight = h * 0.75;
    this.grassTopY = this.skyHeight;
    this.highwayY = h * 0.80;
    this.highwayHeight = h * 0.15;
    this.grassBottomY = this.highwayY + this.highwayHeight;
  },

  // ============ CLOUDS ============

  initClouds() {
    if (!this.showClouds) return;

    const cloudCount = Math.floor(this.canvas.width / 300) + 2;
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push(this.createCloud(true));
    }
  },

  createCloud(initial = false) {
    const y = 30 + Math.random() * (this.skyHeight * 0.5);
    return {
      x: initial ? Math.random() * this.canvas.width : this.canvas.width + 100,
      y: y,
      scale: 0.5 + Math.random() * 0.8,
      speed: 0.2 + Math.random() * 0.3,
      puffs: this.generateCloudPuffs()
    };
  },

  generateCloudPuffs() {
    const puffs = [];
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      puffs.push({
        offsetX: (i - count / 2) * 25 + Math.random() * 10,
        offsetY: Math.random() * 15 - 7,
        radius: 20 + Math.random() * 15
      });
    }
    return puffs;
  },

  drawCloud(cloud) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (const puff of cloud.puffs) {
      ctx.beginPath();
      ctx.arc(puff.offsetX, puff.offsetY, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  updateCloud(cloud, delta) {
    cloud.x -= cloud.speed * this.speed * delta;

    if (cloud.x < -150 * cloud.scale) {
      Object.assign(cloud, this.createCloud(false));
    }
  },

  // ============ VEHICLES ============

  getVehicleSpawnInterval() {
    switch (this.carDensity) {
      case 'light': return 3000;
      case 'medium': return 1500;
      case 'heavy': return 800;
      default: return 1500;
    }
  },

  initVehicles() {
    // Start with a few vehicles on screen
    const count = this.carDensity === 'heavy' ? 6 : this.carDensity === 'medium' ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const vehicle = this.createVehicle(true);
      vehicle.x = Math.random() * this.canvas.width;
      this.vehicles.push(vehicle);
    }
  },

  createVehicle(initial = false) {
    const lane = Math.random() < 0.5 ? 0 : 1; // 0 = top lane (going left), 1 = bottom lane (going right)
    const direction = lane === 0 ? -1 : 1;
    const type = this.VEHICLE_TYPES[Math.floor(Math.random() * this.VEHICLE_TYPES.length)];
    const scale = 0.6 + Math.random() * 0.3;
    const width = this.getVehicleWidth(type) * scale;

    let x;
    if (initial) {
      x = Math.random() * this.canvas.width;
    } else {
      x = direction > 0 ? -width : this.canvas.width + width;
    }

    const laneY = this.highwayY + (lane === 0 ? this.highwayHeight * 0.3 : this.highwayHeight * 0.7);

    return {
      x: x,
      y: laneY,
      type: type,
      color: this.VEHICLE_COLORS[Math.floor(Math.random() * this.VEHICLE_COLORS.length)],
      scale: scale,
      direction: direction,
      speed: (1.5 + Math.random() * 1) * this.speed,
      wheelRotation: Math.random() * Math.PI * 2,
      facingLeft: direction < 0
    };
  },

  getVehicleWidth(type) {
    switch (type) {
      case 'bus': return 100;
      case 'truck': return 70;
      case 'suv': return 60;
      default: return 55;
    }
  },

  updateVehicle(vehicle, delta) {
    vehicle.x += vehicle.direction * vehicle.speed * delta;
    vehicle.wheelRotation += vehicle.speed * delta * 0.3;

    const width = this.getVehicleWidth(vehicle.type) * vehicle.scale;
    if ((vehicle.direction > 0 && vehicle.x > this.canvas.width + width) ||
        (vehicle.direction < 0 && vehicle.x < -width)) {
      return false; // Remove vehicle
    }
    return true;
  },

  drawWheel(x, y, radius, rotation) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  },

  drawSedan(vehicle) {
    const ctx = this.ctx;
    const { x, y, scale, color, wheelRotation, facingLeft } = vehicle;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-25 * scale, -6 * scale, 50 * scale, 18 * scale, 4 * scale);
    ctx.fill();

    // Cabin
    ctx.beginPath();
    ctx.roundRect(-12 * scale, -16 * scale, 28 * scale, 12 * scale, 3 * scale);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(-9 * scale, -14 * scale, 11 * scale, 8 * scale, 2 * scale);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(4 * scale, -14 * scale, 10 * scale, 8 * scale, 2 * scale);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(-25 * scale, -6 * scale, 50 * scale, 18 * scale, 4 * scale);
    ctx.stroke();

    ctx.restore();

    // Wheels
    const wheelY = y + 8 * scale;
    const wheelRadius = 7 * scale;
    this.drawWheel(x - 14 * scale, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 14 * scale, wheelY, wheelRadius, wheelRotation);
  },

  drawSUV(vehicle) {
    const ctx = this.ctx;
    const { x, y, scale, color, wheelRotation, facingLeft } = vehicle;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Body (taller)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-26 * scale, -14 * scale, 52 * scale, 26 * scale, 4 * scale);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(-20 * scale, -11 * scale, 16 * scale, 10 * scale, 2 * scale);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(0 * scale, -11 * scale, 16 * scale, 10 * scale, 2 * scale);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(-26 * scale, -14 * scale, 52 * scale, 26 * scale, 4 * scale);
    ctx.stroke();

    ctx.restore();

    // Bigger wheels
    const wheelY = y + 9 * scale;
    const wheelRadius = 9 * scale;
    this.drawWheel(x - 16 * scale, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 16 * scale, wheelY, wheelRadius, wheelRotation);
  },

  drawTruck(vehicle) {
    const ctx = this.ctx;
    const { x, y, scale, color, wheelRotation, facingLeft } = vehicle;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Truck bed
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-30 * scale, -4 * scale, 35 * scale, 16 * scale, 2 * scale);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Cab
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(5 * scale, -14 * scale, 24 * scale, 26 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();

    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(9 * scale, -11 * scale, 16 * scale, 10 * scale, 2 * scale);
    ctx.fill();

    ctx.restore();

    // Wheels
    const wheelY = y + 9 * scale;
    const wheelRadius = 8 * scale;
    this.drawWheel(x - 18 * scale, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 18 * scale, wheelY, wheelRadius, wheelRotation);
  },

  drawBus(vehicle) {
    const ctx = this.ctx;
    const { x, y, scale, wheelRotation, facingLeft } = vehicle;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Yellow school bus body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.roundRect(-45 * scale, -14 * scale, 90 * scale, 28 * scale, 4 * scale);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Windows
    ctx.fillStyle = '#87CEEB';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.roundRect((-35 + i * 18) * scale, -10 * scale, 12 * scale, 10 * scale, 2 * scale);
      ctx.fill();
    }

    ctx.restore();

    // Wheels
    const wheelY = y + 10 * scale;
    const wheelRadius = 8 * scale;
    this.drawWheel(x - 28 * scale, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 28 * scale, wheelY, wheelRadius, wheelRotation);
  },

  drawVehicle(vehicle) {
    switch (vehicle.type) {
      case 'sedan': this.drawSedan(vehicle); break;
      case 'suv': this.drawSUV(vehicle); break;
      case 'truck': this.drawTruck(vehicle); break;
      case 'bus': this.drawBus(vehicle); break;
    }
  },

  // ============ AIRCRAFT ============

  getAircraftSpawnInterval() {
    switch (this.aircraftFrequency) {
      case 'rare': return 8000;
      case 'occasional': return 4000;
      case 'frequent': return 2000;
      default: return 4000;
    }
  },

  initAircraft() {
    // Start with one aircraft
    this.aircraft.push(this.createAircraft(true));
  },

  createAircraft(initial = false) {
    const isHelicopter = Math.random() < 0.35;
    const type = isHelicopter
      ? 'helicopter'
      : ['propPlane', 'jet', 'biplane'][Math.floor(Math.random() * 3)];

    const direction = Math.random() < 0.5 ? -1 : 1;
    const scale = 0.6 + Math.random() * 0.5;
    const y = 60 + Math.random() * (this.skyHeight * 0.6 - 60);

    let x;
    if (initial) {
      x = Math.random() * this.canvas.width;
    } else {
      x = direction > 0 ? -100 : this.canvas.width + 100;
    }

    // Helicopters get vertical movement
    let vy = 0;
    if (isHelicopter) {
      vy = (Math.random() - 0.5) * 0.5;
    }

    return {
      x: x,
      y: y,
      type: type,
      color: this.VEHICLE_COLORS[Math.floor(Math.random() * this.VEHICLE_COLORS.length)],
      scale: scale,
      direction: direction,
      speed: isHelicopter ? (0.8 + Math.random() * 0.5) * this.speed : (1.5 + Math.random() * 1) * this.speed,
      vy: vy,
      facingLeft: direction < 0
    };
  },

  updateAircraft(craft, delta) {
    craft.x += craft.direction * craft.speed * delta;
    craft.y += craft.vy * delta;

    // Keep helicopters in bounds vertically and occasionally change direction
    if (craft.type === 'helicopter') {
      if (craft.y < 50 || craft.y > this.skyHeight * 0.7) {
        craft.vy *= -1;
      }
      // Randomly adjust vertical speed
      if (Math.random() < 0.01) {
        craft.vy = (Math.random() - 0.5) * 0.5;
      }
    }

    // Check if off screen
    if ((craft.direction > 0 && craft.x > this.canvas.width + 150) ||
        (craft.direction < 0 && craft.x < -150)) {
      return false;
    }
    return true;
  },

  drawPropPlane(craft) {
    const ctx = this.ctx;
    const { x, y, scale, color, facingLeft } = craft;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Fuselage
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 35 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Wings
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-10 * scale, -30 * scale, 20 * scale, 60 * scale, 3 * scale);
    ctx.fill();
    ctx.stroke();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-32 * scale, 0);
    ctx.lineTo(-40 * scale, -15 * scale);
    ctx.lineTo(-35 * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Horizontal tail
    ctx.beginPath();
    ctx.roundRect(-38 * scale, -4 * scale, 12 * scale, 8 * scale, 2 * scale);
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(15 * scale, -2 * scale, 10 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Propeller (animated)
    ctx.fillStyle = '#444';
    ctx.save();
    ctx.translate(36 * scale, 0);
    ctx.rotate(this.propellerRotation);
    ctx.fillRect(-2 * scale, -18 * scale, 4 * scale, 36 * scale);
    ctx.restore();

    // Nose cone
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(36 * scale, 0, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawJet(craft) {
    const ctx = this.ctx;
    const { x, y, scale, color, facingLeft } = craft;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Fuselage
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(45 * scale, 0);
    ctx.lineTo(30 * scale, -8 * scale);
    ctx.lineTo(-40 * scale, -8 * scale);
    ctx.lineTo(-50 * scale, 0);
    ctx.lineTo(-40 * scale, 8 * scale);
    ctx.lineTo(30 * scale, 8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Color stripe
    ctx.fillStyle = color;
    ctx.fillRect(-40 * scale, -3 * scale, 70 * scale, 6 * scale);

    // Wings
    ctx.fillStyle = '#DDD';
    ctx.beginPath();
    ctx.moveTo(-5 * scale, -8 * scale);
    ctx.lineTo(-20 * scale, -35 * scale);
    ctx.lineTo(10 * scale, -35 * scale);
    ctx.lineTo(15 * scale, -8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5 * scale, 8 * scale);
    ctx.lineTo(-20 * scale, 35 * scale);
    ctx.lineTo(10 * scale, 35 * scale);
    ctx.lineTo(15 * scale, 8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail fin
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-35 * scale, -8 * scale);
    ctx.lineTo(-45 * scale, -25 * scale);
    ctx.lineTo(-30 * scale, -25 * scale);
    ctx.lineTo(-25 * scale, -8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windows
    ctx.fillStyle = '#87CEEB';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc((20 - i * 12) * scale, -4 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cockpit
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(38 * scale, 0, 8 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawBiplane(craft) {
    const ctx = this.ctx;
    const { x, y, scale, color, facingLeft } = craft;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Fuselage
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-30 * scale, -6 * scale, 55 * scale, 12 * scale, 3 * scale);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Upper wing
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-20 * scale, -22 * scale, 40 * scale, 10 * scale, 2 * scale);
    ctx.fill();
    ctx.stroke();

    // Lower wing
    ctx.beginPath();
    ctx.roundRect(-20 * scale, 8 * scale, 40 * scale, 10 * scale, 2 * scale);
    ctx.fill();
    ctx.stroke();

    // Wing struts
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-12 * scale, -12 * scale);
    ctx.lineTo(-12 * scale, 8 * scale);
    ctx.moveTo(12 * scale, -12 * scale);
    ctx.lineTo(12 * scale, 8 * scale);
    ctx.stroke();

    // Tail
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-28 * scale, 0);
    ctx.lineTo(-38 * scale, -12 * scale);
    ctx.lineTo(-32 * scale, 0);
    ctx.closePath();
    ctx.fill();

    // Propeller
    ctx.fillStyle = '#8B4513';
    ctx.save();
    ctx.translate(26 * scale, 0);
    ctx.rotate(this.propellerRotation);
    ctx.fillRect(-2 * scale, -15 * scale, 4 * scale, 30 * scale);
    ctx.restore();

    // Nose
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(26 * scale, 0, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(0 * scale, -10 * scale, 12 * scale, 8 * scale, 2 * scale);
    ctx.fill();

    ctx.restore();
  },

  drawHelicopter(craft) {
    const ctx = this.ctx;
    const { x, y, scale, color, facingLeft } = craft;

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Main body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Tail boom
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-25 * scale, -4 * scale);
    ctx.lineTo(-55 * scale, -4 * scale);
    ctx.lineTo(-55 * scale, 4 * scale);
    ctx.lineTo(-25 * scale, 4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail fin
    ctx.beginPath();
    ctx.moveTo(-52 * scale, -4 * scale);
    ctx.lineTo(-58 * scale, -18 * scale);
    ctx.lineTo(-48 * scale, -4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail rotor
    ctx.fillStyle = '#666';
    ctx.save();
    ctx.translate(-55 * scale, -12 * scale);
    ctx.rotate(this.rotorRotation * 1.5);
    ctx.fillRect(-8 * scale, -2 * scale, 16 * scale, 4 * scale);
    ctx.restore();

    // Cockpit window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(15 * scale, -2 * scale, 14 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    // Landing skids
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-20 * scale, 14 * scale);
    ctx.lineTo(-20 * scale, 22 * scale);
    ctx.lineTo(20 * scale, 22 * scale);
    ctx.lineTo(20 * scale, 14 * scale);
    ctx.stroke();

    // Main rotor mast
    ctx.fillStyle = '#444';
    ctx.fillRect(-3 * scale, -14 * scale, 6 * scale, 8 * scale);

    // Main rotor (spinning)
    ctx.save();
    ctx.translate(0, -18 * scale);
    ctx.rotate(this.rotorRotation);
    ctx.fillStyle = '#666';
    ctx.fillRect(-45 * scale, -3 * scale, 90 * scale, 6 * scale);
    ctx.restore();

    ctx.restore();
  },

  drawAircraft(craft) {
    switch (craft.type) {
      case 'propPlane': this.drawPropPlane(craft); break;
      case 'jet': this.drawJet(craft); break;
      case 'biplane': this.drawBiplane(craft); break;
      case 'helicopter': this.drawHelicopter(craft); break;
    }
  },

  // ============ SCENE DRAWING ============

  drawSky() {
    const ctx = this.ctx;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.skyHeight);
    gradient.addColorStop(0, '#4A90D9');    // Deeper blue at top
    gradient.addColorStop(0.7, '#87CEEB');  // Sky blue
    gradient.addColorStop(1, '#B0E0E6');    // Lighter near horizon

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.skyHeight);
  },

  drawSun() {
    const ctx = this.ctx;
    const sunX = this.canvas.width - 100;
    const sunY = 80;
    const sunRadius = 40;

    // Sun glow
    const glowGradient = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2);
    glowGradient.addColorStop(0, 'rgba(255, 255, 100, 0.6)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun rays
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const innerR = sunRadius + 5;
      const outerR = sunRadius + 20;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
      ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
      ctx.stroke();
    }

    // Sun body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(sunX - 10, sunY - 10, sunRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  },

  drawGrass() {
    const ctx = this.ctx;

    // Top grass strip (between sky and highway)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, this.grassTopY, this.canvas.width, this.highwayY - this.grassTopY);

    // Bottom grass strip (below highway)
    ctx.fillRect(0, this.grassBottomY, this.canvas.width, this.canvas.height - this.grassBottomY);

    // Darker grass stripe for depth
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(0, this.grassTopY, this.canvas.width, 3);
    ctx.fillRect(0, this.grassBottomY, this.canvas.width, 3);
  },

  drawHighway() {
    const ctx = this.ctx;

    // Road surface
    ctx.fillStyle = '#555';
    ctx.fillRect(0, this.highwayY, this.canvas.width, this.highwayHeight);

    // Edge lines (white)
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, this.highwayY + 2, this.canvas.width, 4);
    ctx.fillRect(0, this.highwayY + this.highwayHeight - 6, this.canvas.width, 4);

    // Center dashed line (yellow)
    ctx.strokeStyle = '#FFEB3B';
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    ctx.moveTo(0, this.highwayY + this.highwayHeight / 2);
    ctx.lineTo(this.canvas.width, this.highwayY + this.highwayHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },

  // ============ MAIN LOOP ============

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

    // Update rotations
    this.propellerRotation += 0.5 * delta;
    this.rotorRotation += 0.4 * delta;

    // Draw scene (back to front)
    this.drawSky();
    this.drawSun();

    // Update and draw clouds
    if (this.showClouds) {
      for (const cloud of this.clouds) {
        this.updateCloud(cloud, delta);
        this.drawCloud(cloud);
      }
    }

    // Update and draw aircraft (behind clouds looks weird, so draw after)
    for (let i = this.aircraft.length - 1; i >= 0; i--) {
      if (!this.updateAircraft(this.aircraft[i], delta)) {
        this.aircraft.splice(i, 1);
      }
    }
    for (const craft of this.aircraft) {
      this.drawAircraft(craft);
    }

    // Spawn new aircraft
    this.lastAircraftSpawn += deltaTime;
    if (this.lastAircraftSpawn > this.getAircraftSpawnInterval() && this.aircraft.length < 4) {
      this.aircraft.push(this.createAircraft(false));
      this.lastAircraftSpawn = 0;
    }

    // Draw ground
    this.drawGrass();
    this.drawHighway();

    // Update and draw vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      if (!this.updateVehicle(this.vehicles[i], delta)) {
        this.vehicles.splice(i, 1);
      }
    }
    for (const vehicle of this.vehicles) {
      this.drawVehicle(vehicle);
    }

    // Spawn new vehicles
    this.lastVehicleSpawn += deltaTime;
    if (this.lastVehicleSpawn > this.getVehicleSpawnInterval()) {
      this.vehicles.push(this.createVehicle(false));
      this.lastVehicleSpawn = 0;
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
    this.aircraft = [];
    this.clouds = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.Cars4Screensaver = Cars4Screensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('cars4', {
      name: 'Sky Highway',
      module: Cars4Screensaver,
      canvas: true,
      options: {
        carDensity: {
          type: 'select',
          label: 'Traffic Density',
          default: 'medium',
          values: ['light', 'medium', 'heavy'],
          labels: ['Light', 'Medium', 'Heavy']
        },
        aircraftFrequency: {
          type: 'select',
          label: 'Aircraft Frequency',
          default: 'occasional',
          values: ['rare', 'occasional', 'frequent'],
          labels: ['Rare', 'Occasional', 'Frequent']
        },
        showClouds: {
          type: 'checkbox',
          label: 'Show Clouds',
          default: true
        },
        speed: {
          type: 'range',
          label: 'Speed',
          default: 2,
          min: 1,
          max: 5
        }
      }
    });
  }
}
