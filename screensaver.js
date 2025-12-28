const MOUSE_MOVE_THRESHOLD = 500;
let mouseMoveStartTime = null;
let resetTimer = null;
let activeScreensaver = null;

async function initScreensaver() {
  const { loadSettings } = window.ScreensaverSettings;
  const settings = await loadSettings();

  let type = settings.screensaverType;

  // Handle random selection
  if (type === 'random') {
    const types = ['black', 'text', 'pipes'];
    type = types[Math.floor(Math.random() * types.length)];
  }

  console.log('Starting screensaver type:', type);

  // Hide canvas for non-pipes screensavers
  const canvas = document.getElementById('screensaver-canvas');
  canvas.style.display = type === 'pipes' ? 'block' : 'none';

  switch (type) {
    case 'text':
      activeScreensaver = window.TextScreensaver;
      activeScreensaver.init(settings);
      break;
    case 'pipes':
      activeScreensaver = window.PipesScreensaver;
      activeScreensaver.init();
      break;
    case 'black':
    default:
      // Black screen - nothing to initialize
      activeScreensaver = null;
      break;
  }
}

// Handle page visibility for power saving
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden - pausing screensaver');
    if (activeScreensaver?.destroy) {
      activeScreensaver.destroy();
      activeScreensaver = null;
    }
  } else {
    console.log('Page visible - resuming screensaver');
    initScreensaver();
  }
});

function closeScreensaver() {
  if (activeScreensaver?.destroy) {
    activeScreensaver.destroy();
  }

  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: 'closeScreensaver' });
  } else {
    window.close();
  }
}

document.addEventListener('mousemove', () => {
  const now = Date.now();

  if (mouseMoveStartTime === null) {
    mouseMoveStartTime = now;
  }

  if (now - mouseMoveStartTime >= MOUSE_MOVE_THRESHOLD) {
    closeScreensaver();
    return;
  }

  if (resetTimer) {
    clearTimeout(resetTimer);
  }

  resetTimer = setTimeout(() => {
    mouseMoveStartTime = null;
  }, 150);
});

document.addEventListener('keydown', () => {
  closeScreensaver();
});

// Start screensaver when page loads
initScreensaver();
