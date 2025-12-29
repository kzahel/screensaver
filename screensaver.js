const MOUSE_MOVE_THRESHOLD = 500;
let mouseMoveStartTime = null;
let resetTimer = null;
let activeScreensaver = null;
let switchToBlackTimeout = null;
let randomCycleInterval = null;
let currentType = null;
let currentSettings = null;

function getRandomType(settings, excludeType = null) {
  let types = ScreensaverRegistry.listWithBlack();

  // Filter by enabled screensavers if configured
  if (settings.enabledForRandom && settings.enabledForRandom.length > 0) {
    types = types.filter(t => settings.enabledForRandom.includes(t));
  }

  // If we have multiple options, try to avoid picking the same one
  if (excludeType && types.length > 1) {
    types = types.filter(t => t !== excludeType);
  }

  // Fallback to all types if filtering left us empty
  if (types.length === 0) {
    types = ScreensaverRegistry.listWithBlack();
  }

  return types[Math.floor(Math.random() * types.length)];
}

async function initScreensaver() {
  const { loadSettings } = window.ScreensaverSettings;
  const settings = await loadSettings();
  currentSettings = settings;

  let type = settings.screensaverType;

  // Handle random selection using registry
  if (type === 'random') {
    type = getRandomType(settings);
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

  // Set up random cycle timer if configured and in random mode
  if (settings.screensaverType === 'random' && settings.randomCycleMinutes > 0) {
    const cycleMs = settings.randomCycleMinutes * 60 * 1000;
    console.log('Will cycle to new random screensaver every', settings.randomCycleMinutes, 'minutes');

    randomCycleInterval = setInterval(() => {
      cycleToNextRandom();
    }, cycleMs);
  }
}

function cycleToNextRandom() {
  console.log('Cycling to next random screensaver');

  // Destroy current screensaver
  if (activeScreensaver?.destroy) {
    activeScreensaver.destroy();
    activeScreensaver = null;
  }

  // Pick a new random type (avoiding current if possible)
  const newType = getRandomType(currentSettings, currentType);
  currentType = newType;

  console.log('Switched to:', newType);

  // Start the new screensaver
  startScreensaver(newType, currentSettings);
}

function startScreensaver(type, settings) {
  const canvas = document.getElementById('screensaver-canvas');
  const textContainer = document.getElementById('text-container');

  // Hide everything first
  canvas.style.display = 'none';
  textContainer.classList.remove('visible');

  // Handle black screen
  if (type === 'black') {
    activeScreensaver = null;
    return;
  }

  // Look up screensaver from registry
  const config = ScreensaverRegistry.get(type);
  if (!config) {
    console.warn(`Unknown screensaver type: ${type}`);
    activeScreensaver = null;
    return;
  }

  // Show canvas if needed
  if (config.canvas) {
    canvas.style.display = 'block';
  }

  activeScreensaver = config.module;

  // Get defaults from registry and merge with saved settings
  const defaults = ScreensaverRegistry.getDefaults(type);
  const savedSettings = settings[type] || {};
  const opts = {
    ...defaults,
    ...savedSettings,
    maxFramerate: settings.maxFramerate  // Pass global framerate setting
  };

  // Text screensaver has a different init signature (legacy)
  if (type === 'text') {
    activeScreensaver.init({ text: opts });
  } else {
    activeScreensaver.init(opts);
  }
}

function switchToBlack() {
  // Destroy current screensaver
  if (activeScreensaver?.destroy) {
    activeScreensaver.destroy();
    activeScreensaver = null;
  }

  // Clear the random cycle timer when switching to black
  if (randomCycleInterval) {
    clearInterval(randomCycleInterval);
    randomCycleInterval = null;
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
    if (randomCycleInterval) {
      clearInterval(randomCycleInterval);
      randomCycleInterval = null;
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
  if (randomCycleInterval) {
    clearInterval(randomCycleInterval);
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
