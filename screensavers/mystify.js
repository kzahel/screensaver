const MystifyScreensaver = {
  canvas: null,
  ctx: null,
  polygons: [],
  animationId: null,
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Configuration
  numPolygons: 2,
  numVertices: 4,
  trailLength: 50,
  speed: 3,
  targetFps: 60,
  maxFramerate: 0,

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.polygons = [];
    this.lastFrameTime = 0;

    // Apply settings from options
    this.numPolygons = options.numPolygons || 2;
    this.numVertices = options.numVertices || 4;
    this.trailLength = options.trailLength || 50;
    this.speed = options.speed || 3;
    this.maxFramerate = options.maxFramerate || 0;

    // Preview mode support
    this.fixedWidth = options.width || null;
    this.fixedHeight = options.height || null;

    // Scale for preview
    if (this.fixedWidth && this.fixedWidth < 600) {
      this.trailLength = Math.floor(this.trailLength / 2);
      this.speed = 2;
    }

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear canvas to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.initPolygons();
    this.animate();
  },

  handleResize: function() {
    if (window.MystifyScreensaver.canvas && !window.MystifyScreensaver.fixedWidth) {
      window.MystifyScreensaver.resize();
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

  initPolygons() {
    this.polygons = [];
    for (let i = 0; i < this.numPolygons; i++) {
      this.polygons.push(this.createPolygon(i));
    }
  },

  createPolygon(index) {
    const vertices = [];
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Create vertices with random positions and velocities
    for (let i = 0; i < this.numVertices; i++) {
      vertices.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * this.speed * 2,
        vy: (Math.random() - 0.5) * this.speed * 2
      });
    }

    // Offset hue for each polygon so they have different colors
    const hueOffset = (360 / this.numPolygons) * index;

    return {
      vertices: vertices,
      hue: hueOffset,
      trail: []
    };
  },

  updatePolygon(polygon, delta = 1) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Store current vertex positions in trail
    const snapshot = polygon.vertices.map(v => ({ x: v.x, y: v.y }));
    polygon.trail.push({
      vertices: snapshot,
      hue: polygon.hue
    });

    // Limit trail length
    if (polygon.trail.length > this.trailLength) {
      polygon.trail.shift();
    }

    // Update each vertex with delta-scaled movement
    for (const vertex of polygon.vertices) {
      // Move
      vertex.x += vertex.vx * delta;
      vertex.y += vertex.vy * delta;

      // Bounce off edges
      if (vertex.x <= 0) {
        vertex.x = 0;
        vertex.vx = Math.abs(vertex.vx);
      } else if (vertex.x >= width) {
        vertex.x = width;
        vertex.vx = -Math.abs(vertex.vx);
      }

      if (vertex.y <= 0) {
        vertex.y = 0;
        vertex.vy = Math.abs(vertex.vy);
      } else if (vertex.y >= height) {
        vertex.y = height;
        vertex.vy = -Math.abs(vertex.vy);
      }
    }

    // Cycle color with delta scaling
    polygon.hue = (polygon.hue + 0.5 * delta) % 360;
  },

  drawPolygonShape(vertices, hue, alpha) {
    const ctx = this.ctx;
    if (vertices.length < 2) return;

    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);

    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }

    // Close the polygon
    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.stroke();
  },

  drawPolygon(polygon) {
    // Draw trail (oldest to newest, fading in)
    for (let i = 0; i < polygon.trail.length; i++) {
      const trailEntry = polygon.trail[i];
      const alpha = (i + 1) / polygon.trail.length * 0.8;
      this.drawPolygonShape(trailEntry.vertices, trailEntry.hue, alpha);
    }

    // Draw current polygon at full opacity
    this.drawPolygonShape(polygon.vertices, polygon.hue, 1);
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
    const delta = deltaTime / (1000 / this.targetFps);

    // Clear to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw all polygons
    for (const polygon of this.polygons) {
      this.updatePolygon(polygon, delta);
      this.drawPolygon(polygon);
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
    this.polygons = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.MystifyScreensaver = MystifyScreensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('mystify', {
      name: 'Mystify',
      module: MystifyScreensaver,
      canvas: true,
      options: {
        numPolygons: {
          type: 'select',
          label: 'Number of Polygons',
          default: 2,
          values: [1, 2, 3],
          labels: ['1', '2', '3']
        },
        numVertices: {
          type: 'select',
          label: 'Vertices per Polygon',
          default: 4,
          values: [3, 4, 5, 6],
          labels: ['3 (Triangle)', '4 (Quadrilateral)', '5 (Pentagon)', '6 (Hexagon)']
        },
        trailLength: {
          type: 'range',
          label: 'Trail Length',
          default: 50,
          min: 10,
          max: 100
        }
      }
    });
  }
}
