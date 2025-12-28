const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes

let screensaverWindowId = null;
let currentPowerMode = 'normal';

console.log('OLED Screensaver extension loaded');
console.log('Idle threshold:', IDLE_THRESHOLD_SECONDS, 'seconds');

// Load initial power settings
chrome.storage.sync.get('settings', (result) => {
  if (result.settings?.powerMode) {
    updatePowerMode(result.settings.powerMode);
  }
});

function updatePowerMode(mode) {
  chrome.power.releaseKeepAwake();

  currentPowerMode = mode;

  if (mode === 'display') {
    chrome.power.requestKeepAwake('display');
    console.log('Power mode: keeping display on');
  } else if (mode === 'system') {
    chrome.power.requestKeepAwake('system');
    console.log('Power mode: keeping system awake');
  } else {
    console.log('Power mode: normal');
  }
}

async function launchScreensaver() {
  if (screensaverWindowId !== null) {
    console.log('Screensaver already open');
    return;
  }

  console.log('Creating screensaver window...');
  try {
    const url = chrome.runtime.getURL('screensaver.html');
    console.log('Screensaver URL:', url);

    const window = await chrome.windows.create({
      url: url,
      state: 'fullscreen',
      type: 'popup'
    });
    screensaverWindowId = window.id;
    console.log('Screensaver window created with id:', screensaverWindowId);
  } catch (err) {
    console.error('Failed to create screensaver window:', err);
  }
}

chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
console.log('Idle detection interval set');

chrome.idle.queryState(IDLE_THRESHOLD_SECONDS, (state) => {
  console.log('Current idle state:', state);
});

chrome.idle.onStateChanged.addListener(async (state) => {
  console.log('>>> Idle state changed:', state, 'at', new Date().toLocaleTimeString());

  if (state === 'idle') {
    console.log('System is idle, screensaverWindowId:', screensaverWindowId);
    await launchScreensaver();
  } else if (state === 'active') {
    console.log('System is active again');
  } else if (state === 'locked') {
    console.log('System is locked');
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  console.log('Window removed:', windowId);
  if (windowId === screensaverWindowId) {
    screensaverWindowId = null;
    console.log('Screensaver window closed, reset screensaverWindowId');
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  console.log('Message received:', message, 'from:', sender.tab?.id);

  if (message.type === 'settingsChanged') {
    updatePowerMode(message.powerMode);
  }

  if (message.type === 'testScreensaver') {
    launchScreensaver();
  }

  if (message.type === 'closeScreensaver' && sender.tab) {
    console.log('Closing screensaver window');
    chrome.windows.remove(sender.tab.windowId).catch((err) => {
      console.error('Failed to close window:', err);
    });
  }
});

setInterval(() => {
  chrome.idle.queryState(IDLE_THRESHOLD_SECONDS, (state) => {
    console.log('Periodic check - idle state:', state);
  });
}, 5000);
