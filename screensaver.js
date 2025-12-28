const MOUSE_MOVE_THRESHOLD = 500;
let mouseMoveStartTime = null;
let resetTimer = null;
let activeScreensaver = null;
let switchToBlackTimeout = null;
let currentType = null;

async function initScreensaver() {
  const { loadSettings } = window.ScreensaverSettings;
  const settings = await loadSettings();

  let type = settings.screensaverType;

  // Handle random selection
  if (type === 'random') {
    const types = ['black', 'text', 'pipes'];
    type = types[Math.floor(Math.random() * types.length)];
  }

  currentType = type;
  console.log('Starting screensaver type:', type);

  // Apply dim level
  const dimOverlay = document.getElementById('dim-overlay');
  if (dimOverlay) {
    dimOverlay.style.opacity = settings.dimLevel / 100;
  }

  startScreensaver(type, settings);

  // Set up switch-to-black timer if configured and not already black
  if (settings.switchToBlackMinutes > 0 && type !== 'black') {
    const delayMs = settings.switchToBlackMinutes * 60 * 1000;
    console.log('Will switch to black in', settings.switchToBlackMinutes, 'minutes');

    switchToBlackTimeout = setTimeout(() => {
      console.log('Switching to black screen');
      switchToBlack();
    }, delayMs);
  }
}

function startScreensaver(type, settings) {
  const canvas = document.getElementById('screensaver-canvas');
  const textContainer = document.getElementById('text-container');

  // Hide everything first
  canvas.style.display = 'none';
  textContainer.classList.remove('visible');

  switch (type) {
    case 'text':
      activeScreensaver = window.TextScreensaver;
      activeScreensaver.init(settings);
      break;
    case 'pipes':
      canvas.style.display = 'block';
      activeScreensaver = window.PipesScreensaver;
      activeScreensaver.init();
      break;
    case 'black':
    default:
      activeScreensaver = null;
      break;
  }
}

function switchToBlack() {
  // Destroy current screensaver
  if (activeScreensaver?.destroy) {
    activeScreensaver.destroy();
    activeScreensaver = null;
  }

  // Hide all elements
  const canvas = document.getElementById('screensaver-canvas');
  const textContainer = document.getElementById('text-container');
  canvas.style.display = 'none';
  textContainer.classList.remove('visible');

  currentType = 'black';
}

// Handle page visibility for power saving
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden - pausing screensaver');
    if (activeScreensaver?.destroy) {
      activeScreensaver.destroy();
      activeScreensaver = null;
    }
    if (switchToBlackTimeout) {
      clearTimeout(switchToBlackTimeout);
      switchToBlackTimeout = null;
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
  if (switchToBlackTimeout) {
    clearTimeout(switchToBlackTimeout);
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
