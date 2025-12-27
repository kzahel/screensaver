const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes

let screensaverWindowId = null;

console.log('OLED Screensaver extension loaded');
console.log('Idle threshold:', IDLE_THRESHOLD_SECONDS, 'seconds');

chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
console.log('Idle detection interval set');

// Check current state on startup
chrome.idle.queryState(IDLE_THRESHOLD_SECONDS, (state) => {
  console.log('Current idle state:', state);
});

chrome.idle.onStateChanged.addListener(async (state) => {
  console.log('>>> Idle state changed:', state, 'at', new Date().toLocaleTimeString());

  if (state === 'idle') {
    console.log('System is idle, screensaverWindowId:', screensaverWindowId);

    if (screensaverWindowId === null) {
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
    } else {
      console.log('Screensaver already open, skipping');
    }
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
  if (message.type === 'closeScreensaver' && sender.tab) {
    console.log('Closing screensaver window');
    chrome.windows.remove(sender.tab.windowId).catch((err) => {
      console.error('Failed to close window:', err);
    });
  }
});

// Periodic state check for debugging
setInterval(() => {
  chrome.idle.queryState(IDLE_THRESHOLD_SECONDS, (state) => {
    console.log('Periodic check - idle state:', state);
  });
}, 5000);
