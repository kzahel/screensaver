const PipesScreensaver = {
  canvas: null,
  ctx: null,
  pipes: [],
  animationId: null,
  pipeInterval: null,
  gridSize: 20,
  lastFrameTime: 0,
  frameDelay: 50,

  init() {
    this.canvas = document.getElementById('screensaver-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.pipes = [];
    this.resize();

    window.addEventListener('resize', this.handleResize);

    // Clear canvas to black
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Start with one pipe
    this.addPipe();
    this.animate(0);

    // Add new pipes periodically
    this.pipeInterval = setInterval(() => {
      if (this.pipes.length < 6) {
        this.addPipe();
      }
    }, 4000);
  },

  handleResize: function() {
    if (window.PipesScreensaver.canvas) {
      window.PipesScreensaver.resize();
    }
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Redraw black background after resize
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  addPipe() {
    const colors = [
      '#4a9eff', // blue
      '#ff6b6b', // red
      '#4ecdc4', // teal
      '#ffe66d', // yellow
      '#95e1d3', // mint
      '#ff9ff3', // pink
      '#feca57', // orange
      '#48dbfb'  // cyan
    ];
    const directions = ['up', 'down', 'left', 'right'];

    this.pipes.push({
      x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)) * this.gridSize,
      y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)) * this.gridSize,
      direction: directions[Math.floor(Math.random() * 4)],
      color: colors[Math.floor(Math.random() * colors.length)],
      segments: [],
      turnChance: 0.08,
      age: 0,
      maxAge: 300 + Math.floor(Math.random() * 200)
    });
  },

  updatePipe(pipe) {
    // Store current position as segment
    pipe.segments.push({ x: pipe.x, y: pipe.y });
    pipe.age++;

    // Maybe turn
    if (Math.random() < pipe.turnChance) {
      const turns = {
        'up': ['left', 'right'],
        'down': ['left', 'right'],
        'left': ['up', 'down'],
        'right': ['up', 'down']
      };
      const options = turns[pipe.direction];
      pipe.direction = options[Math.floor(Math.random() * 2)];
    }

    // Move
    switch (pipe.direction) {
      case 'up': pipe.y -= this.gridSize; break;
      case 'down': pipe.y += this.gridSize; break;
      case 'left': pipe.x -= this.gridSize; break;
      case 'right': pipe.x += this.gridSize; break;
    }

    // Wrap around screen
    if (pipe.x < 0) pipe.x = this.canvas.width - this.gridSize;
    if (pipe.x >= this.canvas.width) pipe.x = 0;
    if (pipe.y < 0) pipe.y = this.canvas.height - this.gridSize;
    if (pipe.y >= this.canvas.height) pipe.y = 0;

    // Limit segment history
    if (pipe.segments.length > 150) {
      pipe.segments.shift();
    }
  },

  drawPipe(pipe) {
    const ctx = this.ctx;
    const size = this.gridSize - 4;
    const offset = 2;

    // Draw segments with gradient fade
    pipe.segments.forEach((seg, i) => {
      const progress = i / pipe.segments.length;
      const alpha = progress * 0.9;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pipe.color;

      // Draw rounded rectangle
      const x = seg.x + offset;
      const y = seg.y + offset;
      const radius = 3;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);
      ctx.fill();
    });

    // Draw head at full opacity with glow
    ctx.globalAlpha = 1;
    ctx.shadowColor = pipe.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = pipe.color;

    const x = pipe.x + offset;
    const y = pipe.y + offset;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 3);
    ctx.fill();

    ctx.shadowBlur = 0;
  },

  animate(timestamp) {
    // Throttle frame rate
    if (timestamp - this.lastFrameTime < this.frameDelay) {
      this.animationId = requestAnimationFrame((t) => this.animate(t));
      return;
    }
    this.lastFrameTime = timestamp;

    // Fade effect - draw semi-transparent black over everything
    this.ctx.globalAlpha = 0.03;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;

    // Update and draw each pipe
    this.pipes.forEach(pipe => {
      this.updatePipe(pipe);
      this.drawPipe(pipe);
    });

    // Remove old pipes and add new ones
    this.pipes = this.pipes.filter(pipe => pipe.age < pipe.maxAge);

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  },

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.pipeInterval) {
      clearInterval(this.pipeInterval);
      this.pipeInterval = null;
    }
    window.removeEventListener('resize', this.handleResize);
    this.pipes = [];
  }
};

if (typeof window !== 'undefined') {
  window.PipesScreensaver = PipesScreensaver;
}
