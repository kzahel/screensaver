const MatrixScreensaver = {
  canvas: null,
  ctx: null,
  animationId: null,
  columns: [],
  fixedWidth: null,
  fixedHeight: null,
  lastFrameTime: 0,

  // Configuration
  fontSize: 16,
  columnWidth: 20,
  speed: 1,
  density: 1,
  colorMode: 'green', // 'green', 'multi', 'white'
  maxFramerate: 0,
  targetFps: 30,

  // Matrix characters - mix of half-width katakana, numbers, and symbols
  // These are the characters used in the actual Matrix films
  chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()+-=[]{}|;:,.<>?',

  init(options = {}) {
    this.canvas = options.canvas || document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.columns = [];
    this.lastFrameTime = 0;

    // Apply settings from options
    this.speed = options.speed || 1;
    this.density = options.density || 1;
    this.colorMode = options.colorMode || 'green';
    this.maxFramerate = options.maxFramerate || 0;

    // Preview mode support
    this.fixedWidth = options.width || null;
    this.fixedHeight = options.height || null;

    // Scale for preview
    if (this.fixedWidth && this.fixedWidth < 600) {
      this.fontSize = 10;
      this.columnWidth = 12;
    } else {
      this.fontSize = 16;
      this.columnWidth = 20;
    }

    this.resize();

    if (!this.fixedWidth) {
      window.addEventListener('resize', this.handleResize);
    }

    // Clear canvas to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.initColumns();
    this.animate(0);
  },

  handleResize: function() {
    if (window.MatrixScreensaver.canvas && !window.MatrixScreensaver.fixedWidth) {
      window.MatrixScreensaver.resize();
      window.MatrixScreensaver.initColumns();
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

  initColumns() {
    this.columns = [];
    const numColumns = Math.ceil(this.canvas.width / this.columnWidth);

    for (let i = 0; i < numColumns; i++) {
      // Stagger initial drops so they don't all start at the top
      this.columns.push(this.createColumn(i, true));
    }
  },

  createColumn(index, randomStart = false) {
    const x = index * this.columnWidth;
    // Random starting position, with most starting above the screen
    const y = randomStart ? Math.random() * this.canvas.height - this.canvas.height : 0;

    // Random length for each stream
    const streamLength = 10 + Math.floor(Math.random() * 20);

    // Random speed variation per column
    const speedVariation = 0.5 + Math.random() * 1.0;

    // Generate the characters for this stream
    const chars = [];
    for (let i = 0; i < streamLength; i++) {
      chars.push(this.getRandomChar());
    }

    return {
      x,
      y,
      speed: speedVariation,
      streamLength,
      chars,
      charChangeTimer: 0,
      active: Math.random() < this.density // Some columns may be inactive based on density
    };
  },

  getRandomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  },

  getColor(position, streamLength) {
    // Position 0 is the head (brightest), higher positions fade
    const brightness = 1 - (position / streamLength);

    switch (this.colorMode) {
      case 'multi':
        // Cycle through colors
        const hue = (Date.now() / 50 + position * 10) % 360;
        const saturation = 100;
        const lightness = Math.floor(30 + brightness * 50);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      case 'white':
        const whiteVal = Math.floor(100 + brightness * 155);
        return `rgb(${whiteVal}, ${whiteVal}, ${whiteVal})`;

      case 'green':
      default:
        // Classic Matrix green with varying brightness
        if (position === 0) {
          // Head is white/bright green
          return '#afffaf';
        }
        const green = Math.floor(80 + brightness * 175);
        const red = Math.floor(brightness * 30);
        return `rgb(${red}, ${green}, ${Math.floor(red / 2)})`;
    }
  },

  updateColumn(column, delta) {
    if (!column.active) {
      // Randomly activate inactive columns
      if (Math.random() < 0.002 * this.density) {
        column.active = true;
        column.y = 0;
      }
      return;
    }

    // Move the column down
    column.y += this.speed * column.speed * delta * 5;

    // Randomly change characters in the stream for "glitch" effect
    column.charChangeTimer += delta;
    if (column.charChangeTimer > 2) {
      column.charChangeTimer = 0;
      // Change a random character in the stream
      const changeIndex = Math.floor(Math.random() * column.chars.length);
      column.chars[changeIndex] = this.getRandomChar();
    }

    // Reset column when it goes off screen
    const streamBottom = column.y;
    const streamTop = column.y - column.streamLength * this.fontSize;

    if (streamTop > this.canvas.height) {
      // Reset to top with new random properties
      column.y = 0;
      column.streamLength = 10 + Math.floor(Math.random() * 20);
      column.speed = 0.5 + Math.random() * 1.0;
      column.active = Math.random() < this.density;

      // Regenerate characters
      column.chars = [];
      for (let i = 0; i < column.streamLength; i++) {
        column.chars.push(this.getRandomChar());
      }
    }
  },

  drawColumn(column) {
    if (!column.active) return;

    const ctx = this.ctx;
    ctx.font = `${this.fontSize}px monospace`;

    // Draw each character in the stream
    for (let i = 0; i < column.streamLength; i++) {
      const charY = column.y - i * this.fontSize;

      // Skip if off screen
      if (charY < -this.fontSize || charY > this.canvas.height + this.fontSize) {
        continue;
      }

      ctx.fillStyle = this.getColor(i, column.streamLength);
      ctx.fillText(column.chars[i], column.x, charY);
    }
  },

  animate(timestamp) {
    // Framerate limiting
    const targetFrameTime = 1000 / this.targetFps;
    if (this.maxFramerate > 0) {
      const minFrameTime = 1000 / this.maxFramerate;
      if (timestamp - this.lastFrameTime < Math.max(minFrameTime, targetFrameTime)) {
        this.animationId = requestAnimationFrame((t) => this.animate(t));
        return;
      }
    } else if (timestamp - this.lastFrameTime < targetFrameTime) {
      this.animationId = requestAnimationFrame((t) => this.animate(t));
      return;
    }

    // Calculate delta time for frame-rate independent movement
    const deltaTime = this.lastFrameTime ? (timestamp - this.lastFrameTime) : 33.33;
    this.lastFrameTime = timestamp;
    const delta = deltaTime / (1000 / this.targetFps);

    // Fade effect - draw semi-transparent black over everything
    // This creates the trailing effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw all columns
    for (const column of this.columns) {
      this.updateColumn(column, delta);
      this.drawColumn(column);
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
    this.columns = [];
  }
};

// Self-registration with the screensaver registry
if (typeof window !== 'undefined') {
  window.MatrixScreensaver = MatrixScreensaver;

  if (window.ScreensaverRegistry) {
    ScreensaverRegistry.register('matrix', {
      name: 'Matrix',
      module: MatrixScreensaver,
      canvas: true,
      options: {
        speed: {
          type: 'range',
          label: 'Speed',
          default: 1,
          min: 0.5,
          max: 3,
          step: 0.5
        },
        density: {
          type: 'range',
          label: 'Density',
          default: 1,
          min: 0.3,
          max: 1,
          step: 0.1
        },
        colorMode: {
          type: 'select',
          label: 'Color Mode',
          default: 'green',
          values: ['green', 'multi', 'white'],
          labels: ['Classic Green', 'Rainbow', 'White']
        }
      }
    });
  }
}
