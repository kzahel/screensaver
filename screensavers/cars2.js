// Cars2 - Highway Parade Screensaver
// Endless stream of vehicles driving across the screen in multiple lanes

const Cars2Screensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Collections
  vehicles: [],
  lanes: [],

  // Resolution-independent scale factor (calculated in resize)
  baseScale: 1,

  // Configuration
  laneCount: 4,
  density: 'medium',
  speed: 2,
  includeEmergency: true,
  includeConstruction: true,
  targetFps: 60,
  maxFramerate: 0,

  // Light flash timing
  lightTimer: 0,
  lightsOn: false,

  // Cement mixer rotation
  mixerRotation: 0,

  // Flag to reinitialize on first frame
  needsLaneInit: true,
  lastCanvasHeight: 0,

  // Bright toddler-friendly colors (hue values)
  COLORS: [0, 30, 50, 120, 200, 270, 330, 190],

  // Vehicle types by category
  REGULAR_VEHICLES: ['sedan', 'truck', 'bus', 'suv'],
  EMERGENCY_VEHICLES: ['firetruck', 'police', 'ambulance'],
  CONSTRUCTION_VEHICLES: ['dumptruck', 'cementmixer'],

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');
    // Reset any transforms from previous screensaver
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Reset state
    this.vehicles = [];
    this.lanes = [];
    this.lastFrameTime = 0;
    this.lightTimer = 0;
    this.lightsOn = false;
    this.mixerRotation = 0;
    this.needsLaneInit = true;
    this.lastCanvasHeight = 0;

    // Apply settings (types are automatically parsed by OptionsGenerator/Registry)
    this.laneCount = options.laneCount ?? 4;
    this.density = options.density ?? 'medium';
    this.speed = options.speed ?? 2;
    this.includeEmergency = options.includeEmergency ?? true;
    this.includeConstruction = options.includeConstruction ?? true;
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
      this.laneCount = Math.max(2, Math.floor(this.laneCount / 2));
    }

    this.resize();
    this.initLanes();

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
    if (window.Cars2Screensaver && !window.Cars2Screensaver.fixedWidth) {
      window.Cars2Screensaver.resize();
      window.Cars2Screensaver.initLanes();
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

  initLanes() {
    // Get canvas height - the canvas.height property is what we need
    // (this is the drawing buffer size, which resize() should have set)
    // Use the same value that resize() uses
    let canvasHeight;
    if (this.fixedHeight) {
      canvasHeight = this.fixedHeight;
    } else {
      // Use window dimensions directly, same as resize() does
      canvasHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || window.screen.height || 800;
    }

    // Store old lane speeds if they exist (to preserve randomization)
    const oldLaneSpeeds = this.lanes.map(l => l.baseSpeed);

    this.lanes = [];
    const laneSpacing = canvasHeight / (this.laneCount + 1);

    for (let i = 0; i < this.laneCount; i++) {
      const laneY = laneSpacing * (i + 1);
      this.lanes.push({
        y: laneY,
        direction: i % 2 === 0 ? 1 : -1, // Alternating directions
        baseSpeed: oldLaneSpeeds[i] || this.speed * (0.8 + Math.random() * 0.4)
      });
    }

    // Update existing vehicles to new lane positions
    for (const vehicle of this.vehicles) {
      if (vehicle.laneIndex !== undefined && vehicle.laneIndex < this.lanes.length) {
        vehicle.y = this.lanes[vehicle.laneIndex].y;
      }
    }
  },

  getVehicleTypes() {
    let types = [...this.REGULAR_VEHICLES];
    if (this.includeEmergency) {
      types = types.concat(this.EMERGENCY_VEHICLES);
    }
    if (this.includeConstruction) {
      types = types.concat(this.CONSTRUCTION_VEHICLES);
    }
    return types;
  },

  getVehiclesPerLane() {
    switch (this.density) {
      case 'light': return 2;
      case 'medium': return 3;
      case 'heavy': return 5;
      default: return 3;
    }
  },

  initVehicles() {
    const vehiclesPerLane = this.getVehiclesPerLane();
    const types = this.getVehicleTypes();

    for (let laneIndex = 0; laneIndex < this.lanes.length; laneIndex++) {
      const lane = this.lanes[laneIndex];

      for (let i = 0; i < vehiclesPerLane; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const vehicle = this.createVehicle(type, laneIndex, true);

        // Stagger initial positions
        if (lane.direction > 0) {
          vehicle.x = -this.getVehicleWidth(type) + (i * this.canvas.width / vehiclesPerLane);
        } else {
          vehicle.x = this.canvas.width + this.getVehicleWidth(type) - (i * this.canvas.width / vehiclesPerLane);
        }

        this.vehicles.push(vehicle);
      }
    }
  },

  createVehicle(type, laneIndex, initial = false) {
    const lane = this.lanes[laneIndex];
    const scale = 0.7 + Math.random() * 0.4;
    const width = this.getVehicleWidth(type) * scale;

    let x;
    if (initial) {
      x = Math.random() * this.canvas.width;
    } else {
      // Spawn at edge
      x = lane.direction > 0 ? -width : this.canvas.width + width;
    }

    return {
      x: x,
      y: lane.y,
      speed: lane.baseSpeed * (0.8 + Math.random() * 0.4),
      direction: lane.direction,
      type: type,
      hue: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      wheelRotation: Math.random() * Math.PI * 2,
      scale: scale,
      laneIndex: laneIndex,
      facingLeft: lane.direction < 0
    };
  },

  getVehicleWidth(type) {
    const base = (() => {
      switch (type) {
        case 'bus': return 120;
        case 'firetruck': return 100;
        case 'ambulance': return 85;
        case 'dumptruck': return 90;
        case 'cementmixer': return 95;
        case 'truck': return 80;
        case 'suv': return 75;
        default: return 70;
      }
    })();
    return base * this.baseScale;
  },

  updateVehicle(vehicle, delta) {
    // Update position
    vehicle.x += vehicle.direction * vehicle.speed * delta;

    // Update wheel rotation
    vehicle.wheelRotation += vehicle.speed * delta * 0.3;

    // Check if off screen
    const width = this.getVehicleWidth(vehicle.type) * vehicle.scale;

    let offScreen = false;
    if (vehicle.direction > 0 && vehicle.x > this.canvas.width + width) {
      offScreen = true;
    } else if (vehicle.direction < 0 && vehicle.x < -width) {
      offScreen = true;
    }

    // Respawn at opposite edge
    if (offScreen) {
      const types = this.getVehicleTypes();
      const newType = types[Math.floor(Math.random() * types.length)];
      const newVehicle = this.createVehicle(newType, vehicle.laneIndex, false);
      Object.assign(vehicle, newVehicle);
    }
  },

  // Draw a simple wheel with hubcap
  drawWheel(x, y, radius, rotation) {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(rotation) * radius * 0.5, y + Math.sin(rotation) * radius * 0.5);
    ctx.stroke();
  },

  drawSedan(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    const bodyColor = `hsl(${hue}, 80%, 50%)`;

    // Car body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.fill();

    // Cabin
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

    ctx.restore();

    // Wheels
    const wheelY = y + 12 * s;
    const wheelRadius = 10 * s;
    this.drawWheel(x - 18 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 18 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawSUV(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    const bodyColor = `hsl(${hue}, 70%, 45%)`;

    // SUV body (taller than sedan)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-32 * s, -20 * s, 64 * s, 36 * s, 5 * s);
    ctx.fill();

    // Roof rack
    ctx.fillStyle = '#666';
    ctx.fillRect(-25 * s, -24 * s, 50 * s, 4 * s);

    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(-25 * s, -16 * s, 20 * s, 14 * s, 2 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(0 * s, -16 * s, 20 * s, 14 * s, 2 * s);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.roundRect(-32 * s, -20 * s, 64 * s, 36 * s, 5 * s);
    ctx.stroke();

    // Headlight
    ctx.fillStyle = '#FFFF88';
    ctx.beginPath();
    ctx.arc(30 * s, 4 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bigger wheels for SUV
    const wheelY = y + 12 * s;
    const wheelRadius = 12 * s;
    this.drawWheel(x - 20 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 20 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawTruck(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

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

    ctx.restore();

    // Wheels
    const wheelY = y + 12 * s;
    const wheelRadius = 10 * s;
    this.drawWheel(x - 22 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 22 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawBus(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Yellow school bus color
    ctx.fillStyle = '#FFD700';
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

    // STOP sign arm (simplified)
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.roundRect(-58 * s, -8 * s, 8 * s, 12 * s, 1 * s);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#FFFF88';
    ctx.beginPath();
    ctx.arc(52 * s, 8 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Wheels
    const wheelY = y + 14 * s;
    const wheelRadius = 10 * s;
    this.drawWheel(x - 35 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 35 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawFireTruck(vehicle) {
    const ctx = this.ctx;
    const { x, y, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

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

    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(28 * s, -18 * s, 18 * s, 12 * s, 2 * s);
    ctx.fill();

    // Ladder
    ctx.fillStyle = '#CCC';
    ctx.fillRect(-40 * s, -12 * s, 60 * s, 4 * s);
    ctx.fillRect(-40 * s, -6 * s, 60 * s, 4 * s);
    for (let i = 0; i < 6; i++) {
      ctx.fillRect((-35 + i * 12) * s, -12 * s, 3 * s, 10 * s);
    }

    // Emergency light
    ctx.fillStyle = this.lightsOn ? '#FF0000' : '#880000';
    ctx.beginPath();
    ctx.arc(35 * s, -26 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    if (this.lightsOn) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(35 * s, -26 * s, 12 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const wheelY = y + 14 * s;
    const wheelRadius = 10 * s;
    this.drawWheel(x - 32 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 32 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawPoliceCar(vehicle) {
    const ctx = this.ctx;
    const { x, y, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Black and white body
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.fill();

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

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.roundRect(-30 * s, -8 * s, 60 * s, 24 * s, 4 * s);
    ctx.stroke();

    ctx.restore();

    const wheelY = y + 12 * s;
    const wheelRadius = 10 * s;
    this.drawWheel(x - 18 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 18 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawAmbulance(vehicle) {
    const ctx = this.ctx;
    const { x, y, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // White body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-38 * s, -15 * s, 76 * s, 32 * s, 4 * s);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Red stripe
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(-38 * s, 0 * s, 76 * s, 8 * s);

    // Red cross
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(-20 * s, -12 * s, 20 * s, 6 * s);
    ctx.fillRect(-13 * s, -18 * s, 6 * s, 18 * s);

    // Cab window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(20 * s, -12 * s, 15 * s, 10 * s, 2 * s);
    ctx.fill();

    // Emergency light
    ctx.fillStyle = this.lightsOn ? '#FF0000' : '#880000';
    ctx.beginPath();
    ctx.arc(0, -20 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();

    if (this.lightsOn) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(0, -20 * s, 12 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const wheelY = y + 14 * s;
    const wheelRadius = 10 * s;
    this.drawWheel(x - 25 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 25 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawDumpTruck(vehicle) {
    const ctx = this.ctx;
    const { x, y, hue, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Dump bed - yellow/orange construction color
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.moveTo(-40 * s, -5 * s);
    ctx.lineTo(-35 * s, -22 * s);
    ctx.lineTo(20 * s, -22 * s);
    ctx.lineTo(20 * s, 12 * s);
    ctx.lineTo(-40 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Dirt/rocks in the bed
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(-20 * s, -10 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-5 * s, -8 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-12 * s, -15 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Cab
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.roundRect(20 * s, -18 * s, 25 * s, 30 * s, 4 * s);
    ctx.fill();
    ctx.stroke();

    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(24 * s, -14 * s, 16 * s, 10 * s, 2 * s);
    ctx.fill();

    ctx.restore();

    // Big construction wheels
    const wheelY = y + 10 * s;
    const wheelRadius = 12 * s;
    this.drawWheel(x - 28 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 30 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawCementMixer(vehicle) {
    const ctx = this.ctx;
    const { x, y, wheelRotation, facingLeft } = vehicle;
    const s = vehicle.scale * this.baseScale; // Combined scale factor

    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) ctx.scale(-1, 1);

    // Truck base
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.roundRect(-42 * s, 0 * s, 84 * s, 18 * s, 4 * s);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Mixer drum (barrel shape - doesn't rotate, stripes animate)
    const drumX = -10 * s;
    const drumY = -8 * s;
    const drumWidth = 28 * s;
    const drumHeight = 18 * s;

    // Drum body (static ellipse)
    ctx.fillStyle = '#DDDDDD';
    ctx.beginPath();
    ctx.ellipse(drumX, drumY, drumWidth, drumHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Animated stripes - offset vertically based on rotation to simulate rolling
    const stripeOffset = (Math.sin(this.mixerRotation * 3) * drumHeight * 0.6);

    ctx.save();
    // Clip to drum shape
    ctx.beginPath();
    ctx.ellipse(drumX, drumY, drumWidth - 2, drumHeight - 2, 0, 0, Math.PI * 2);
    ctx.clip();

    // Draw multiple horizontal stripes that move up and down
    ctx.strokeStyle = '#FF6600';
    ctx.lineWidth = 6 * s;

    for (let i = -2; i <= 2; i++) {
      const baseY = drumY + i * drumHeight * 0.5;
      const animY = baseY + stripeOffset;
      // Wrap stripes
      const wrappedY = ((animY - drumY + drumHeight * 1.5) % (drumHeight * 2)) - drumHeight + drumY;

      ctx.beginPath();
      ctx.moveTo(drumX - drumWidth, wrappedY);
      ctx.lineTo(drumX + drumWidth, wrappedY);
      ctx.stroke();
    }

    ctx.restore();

    // Drum end caps (darker circles on sides)
    ctx.fillStyle = '#BBB';
    ctx.beginPath();
    ctx.ellipse(drumX - drumWidth + 4 * s, drumY, 4 * s, drumHeight * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(drumX + drumWidth - 4 * s, drumY, 4 * s, drumHeight * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cab
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.roundRect(25 * s, -15 * s, 22 * s, 30 * s, 4 * s);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2 * s;
    ctx.stroke();

    // Window
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.roundRect(28 * s, -12 * s, 15 * s, 10 * s, 2 * s);
    ctx.fill();

    ctx.restore();

    // Wheels
    const wheelY = y + 14 * s;
    const wheelRadius = 11 * s;
    this.drawWheel(x - 30 * s, wheelY, wheelRadius, wheelRotation);
    this.drawWheel(x + 32 * s, wheelY, wheelRadius, wheelRotation);
  },

  drawVehicle(vehicle) {
    switch (vehicle.type) {
      case 'sedan': this.drawSedan(vehicle); break;
      case 'suv': this.drawSUV(vehicle); break;
      case 'truck': this.drawTruck(vehicle); break;
      case 'bus': this.drawBus(vehicle); break;
      case 'firetruck': this.drawFireTruck(vehicle); break;
      case 'police': this.drawPoliceCar(vehicle); break;
      case 'ambulance': this.drawAmbulance(vehicle); break;
      case 'dumptruck': this.drawDumpTruck(vehicle); break;
      case 'cementmixer': this.drawCementMixer(vehicle); break;
    }
  },

  drawRoad() {
    const ctx = this.ctx;

    // Draw lane dividers (dashed lines between lanes)
    ctx.strokeStyle = '#FFFF00';
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 3;

    for (let i = 0; i < this.lanes.length - 1; i++) {
      const y1 = this.lanes[i].y;
      const y2 = this.lanes[i + 1].y;
      const midY = (y1 + y2) / 2;

      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(this.canvas.width, midY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
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

    // Check if we need to reinitialize lanes (canvas might not have been ready during init)
    const currentHeight = this.canvas.height || window.innerHeight;
    if (this.needsLaneInit || (currentHeight > 100 && currentHeight !== this.lastCanvasHeight)) {
      this.lastCanvasHeight = currentHeight;
      this.needsLaneInit = false;
      this.initLanes();
      // Reinitialize vehicles if lanes changed and we don't have vehicles yet
      if (this.vehicles.length === 0) {
        this.initVehicles();
      }
    }

    // Update light flash timer
    this.lightTimer += deltaTime;
    if (this.lightTimer > 300) {
      this.lightsOn = !this.lightsOn;
      this.lightTimer = 0;
    }

    // Update mixer rotation
    this.mixerRotation += 0.05 * delta;

    // Clear to dark gray (road color)
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw road markings
    this.drawRoad();

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
    this.lanes = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.Cars2Screensaver = Cars2Screensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('cars2', {
      name: 'Highway Parade',
      module: Cars2Screensaver,
      canvas: true,
      options: {
        laneCount: {
          type: 'select',
          label: 'Number of Lanes',
          default: 4,
          values: [3, 4, 5],
          labels: ['3 Lanes', '4 Lanes', '5 Lanes']
        },
        density: {
          type: 'select',
          label: 'Traffic Density',
          default: 'medium',
          values: ['light', 'medium', 'heavy'],
          labels: ['Light', 'Medium', 'Heavy']
        },
        speed: {
          type: 'range',
          label: 'Speed',
          default: 2,
          min: 1,
          max: 5
        },
        includeEmergency: {
          type: 'checkbox',
          label: 'Include Emergency Vehicles',
          default: true
        },
        includeConstruction: {
          type: 'checkbox',
          label: 'Include Construction Vehicles',
          default: true
        }
      }
    });
  }
}
