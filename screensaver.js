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
    const types = ['black', 'text', 'pipes', 'starfield', 'mystify', 'pyro'];
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
    case 'starfield':
      canvas.style.display = 'block';
      activeScreensaver = window.StarfieldScreensaver;
      activeScreensaver.init({
        starDensity: settings.starfield?.starDensity || 200,
        warpSpeed: settings.starfield?.warpSpeed || 5
      });
      break;
    case 'mystify':
      canvas.style.display = 'block';
      activeScreensaver = window.MystifyScreensaver;
      activeScreensaver.init({
        numPolygons: settings.mystify?.numPolygons || 2,
        numVertices: settings.mystify?.numVertices || 4,
        trailLength: settings.mystify?.trailLength || 50
      });
      break;
    case 'pyro':
      canvas.style.display = 'block';
      activeScreensaver = window.PyroScreensaver;
      activeScreensaver.init({
        launchFrequency: settings.pyro?.launchFrequency || 5,
        explosionSize: settings.pyro?.explosionSize || 'medium',
        colorMode: settings.pyro?.colorMode || 'rainbow',
        gravity: settings.pyro?.gravity || 1.0
      });
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
