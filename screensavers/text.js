const TextScreensaver = {
  container: null,
  settings: null,
  cycleIntervalId: null,
  timeIntervalId: null,

  init(settings) {
    this.settings = settings.text;
    this.container = document.getElementById('text-container');
    this.updateContent();
    this.positionContainer();
    this.show();

    // Update time every second if showing time
    if (this.settings.showTime) {
      this.timeIntervalId = setInterval(() => {
        this.updateTimeDisplay();
      }, 1000);
    }

    // Cycle position and quote every 8 seconds
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
  },

  updateContent() {
    const timeEl = document.getElementById('time-display');
    const dateEl = document.getElementById('date-display');
    const customEl = document.getElementById('custom-text');
    const quoteEl = document.getElementById('quote-text');

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
    const timeEl = document.getElementById('time-display');
    if (timeEl && this.settings.showTime) {
      timeEl.textContent = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  updateQuoteDisplay() {
    const quoteEl = document.getElementById('quote-text');
    if (quoteEl && this.settings.showQuotes) {
      quoteEl.textContent = window.ScreensaverQuotes.getRandomQuote();
    }
  },

  positionContainer() {
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
