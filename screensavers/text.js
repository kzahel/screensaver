const TextScreensaver = {
  container: null,
  settings: null,
  cycleIntervalId: null,
  timeIntervalId: null,
  previewMode: false,
  idPrefix: '',

  init(settings, options = {}) {
    this.settings = settings.text;
    this.previewMode = options.previewMode || false;
    this.idPrefix = options.idPrefix || '';
    this.container = options.container || document.getElementById('text-container');
    this.updateContent();
    this.positionContainer();
    this.show();

    // Update time every second if showing time
    if (this.settings.showTime) {
      this.timeIntervalId = setInterval(() => {
        this.updateTimeDisplay();
      }, 1000);
    }

    // Cycle position and quote every 8 seconds (skip in preview mode)
    if (!this.previewMode) {
      this.cycleIntervalId = setInterval(() => {
        this.hide();
        setTimeout(() => {
          this.positionContainer();
          if (this.settings.showQuotes) {
            this.updateQuoteDisplay();
          }
          this.show();
        }, 1000);
      }, 8000);
    }
  },

  getElement(id) {
    const fullId = this.idPrefix + id;
    // In preview mode, only look within the container to avoid conflicts with settings inputs
    if (this.previewMode && this.container) {
      return this.container.querySelector('#' + fullId);
    }
    // In fullscreen mode, use the container if available, otherwise document
    if (this.container) {
      return this.container.querySelector('#' + fullId) || document.getElementById(fullId);
    }
    return document.getElementById(fullId);
  },

  updateContent() {
    const timeEl = this.getElement('time-display');
    const dateEl = this.getElement('date-display');
    const customEl = this.getElement('custom-text');
    const quoteEl = this.getElement('quote-text');

    const now = new Date();

    if (this.settings.showTime) {
      timeEl.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      timeEl.style.display = 'block';
    } else {
      timeEl.style.display = 'none';
    }

    if (this.settings.showDate) {
      dateEl.textContent = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      dateEl.style.display = 'block';
    } else {
      dateEl.style.display = 'none';
    }

    if (this.settings.customText) {
      customEl.textContent = this.settings.customText;
      customEl.style.display = 'block';
    } else {
      customEl.style.display = 'none';
    }

    if (this.settings.showQuotes) {
      quoteEl.textContent = window.ScreensaverQuotes.getRandomQuote();
      quoteEl.style.display = 'block';
    } else {
      quoteEl.style.display = 'none';
    }
  },

  updateTimeDisplay() {
    const timeEl = this.getElement('time-display');
    if (timeEl && this.settings.showTime) {
      timeEl.textContent = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  updateQuoteDisplay() {
    const quoteEl = this.getElement('quote-text');
    if (quoteEl && this.settings.showQuotes) {
      quoteEl.textContent = window.ScreensaverQuotes.getRandomQuote();
    }
  },

  positionContainer() {
    if (this.previewMode) {
      // Center in preview mode
      this.container.style.left = '50%';
      this.container.style.top = '50%';
      this.container.style.transform = 'translate(-50%, -50%)';
      return;
    }

    // Random position for fullscreen mode
    this.container.style.transform = '';
    const padding = 50;
    const rect = this.container.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    const x = padding + Math.random() * Math.max(0, maxX - padding);
    const y = padding + Math.random() * Math.max(0, maxY - padding);

    this.container.style.left = x + 'px';
    this.container.style.top = y + 'px';
  },

  show() {
    this.container.classList.add('visible');
  },

  hide() {
    this.container.classList.remove('visible');
  },

  destroy() {
    if (this.cycleIntervalId) {
      clearInterval(this.cycleIntervalId);
      this.cycleIntervalId = null;
    }
    if (this.timeIntervalId) {
      clearInterval(this.timeIntervalId);
      this.timeIntervalId = null;
    }
    this.container.classList.remove('visible');
  }
};

if (typeof window !== 'undefined') {
  window.TextScreensaver = TextScreensaver;
}
