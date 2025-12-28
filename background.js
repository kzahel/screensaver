let idleThresholdSeconds = 300; // Default 5 minutes
let screensaverWindowId = null;
let currentPowerMode = 'normal';
let extensionEnabled = true; // Master switch

// Service worker lifecycle: this code runs on every start (including after suspension).
// Event listeners MUST be registered synchronously at top level for Chrome to wake the worker.
console.log('Service worker started');

// Load initial settings
Promise.all([
  chrome.storage.sync.get('settings'),
  chrome.storage.local.get('enabled')
]).then(([syncResult, localResult]) => {
  extensionEnabled = localResult.enabled ?? true;

  if (extensionEnabled) {
    if (syncResult.settings?.powerMode) {
      updatePowerMode(syncResult.settings.powerMode);
    }
    // Always set idle threshold - use saved value or default
    const minutes = syncResult.settings?.idleMinutes || 5;
    updateIdleThreshold(minutes, true); // force=true to ensure setDetectionInterval is called
  } else {
    disableExtension();
  }
  console.log('Initial settings loaded:', { enabled: extensionEnabled, ...syncResult.settings });
});

function disableExtension() {
  chrome.power.releaseKeepAwake();
  console.log('Extension disabled - power management released');
}

function updateIdleThreshold(minutes, force = false) {
  const newThreshold = Math.max(60, minutes * 60); // Minimum 1 minute
  if (force || newThreshold !== idleThresholdSeconds) {
    idleThresholdSeconds = newThreshold;
    chrome.idle.setDetectionInterval(idleThresholdSeconds);
    console.log('Idle threshold updated:', idleThresholdSeconds, 'seconds');
  }
}

function updatePowerMode(mode) {
  chrome.power.releaseKeepAwake();

  currentPowerMode = mode;

  // Note: On Linux, requestKeepAwake can interfere with chrome.idle detection,
  // causing the screensaver to never trigger. Use 'normal' mode if idle detection fails.
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

// Query initial idle state (detection interval is set after settings load)
chrome.idle.queryState(idleThresholdSeconds, (state) => {
  console.log('Current idle state:', state);
});

chrome.idle.onStateChanged.addListener(async (state) => {
  console.log('>>> IDLE STATE CHANGED:', state, 'at', new Date().toLocaleTimeString());

  if (!extensionEnabled) {
    console.log('Extension disabled, ignoring idle state change');
    return;
  }

  if (state === 'idle') {
    console.log('System is idle, launching screensaver...');
    await launchScreensaver();
  } else if (state === 'active') {
    console.log('System is active again');
  } else if (state === 'locked') {
    console.log('System is locked');
  }
});

console.log('Idle state change listener registered');

chrome.windows.onRemoved.addListener((windowId) => {
  console.log('Window removed:', windowId);
  if (windowId === screensaverWindowId) {
    screensaverWindowId = null;
    console.log('Screensaver window closed, reset screensaverWindowId');
  }
});

// Open options page when extension icon is clicked
chrome.action.onClicked.addListener(async () => {
  const optionsUrl = chrome.runtime.getURL('options.html');
  // Use getContexts() instead of tabs.query({ url }) - works without "tabs" permission
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['TAB'] });
  const optionsContext = contexts.find(c => c.documentUrl === optionsUrl);

  if (optionsContext) {
    // Focus existing tab
    await chrome.tabs.update(optionsContext.tabId, { active: true });
    await chrome.windows.update(optionsContext.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: optionsUrl });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  console.log('Message received:', message, 'from:', sender.tab?.id);

  if (message.type === 'settingsChanged') {
    extensionEnabled = message.enabled;

    if (extensionEnabled) {
      updatePowerMode(message.powerMode);
      if (message.idleMinutes) {
        updateIdleThreshold(message.idleMinutes);
      }
    } else {
      disableExtension();
    }
  }

  if (message.type === 'testScreensaver' && extensionEnabled) {
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
  if (!extensionEnabled) return;
  chrome.idle.queryState(idleThresholdSeconds, (state) => {
    console.log('Periodic check - idle state:', state, 'threshold:', idleThresholdSeconds);
  });
}, 5000);
