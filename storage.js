const DEFAULT_SETTINGS = {
  screensaverType: 'black',
  powerMode: 'normal',
  idleMinutes: 5,
  switchToBlackMinutes: 0, // 0 = disabled
  dimLevel: 0, // 0-100, percentage of screen dimming
  text: {
    showTime: true,
    showDate: true,
    customText: '',
    showQuotes: true
  }
};

async function loadSettings() {
  const result = await chrome.storage.sync.get('settings');
  return {
    ...DEFAULT_SETTINGS,
    ...result.settings,
    text: {
      ...DEFAULT_SETTINGS.text,
      ...(result.settings?.text || {})
    }
  };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings });
}

if (typeof window !== 'undefined') {
  window.ScreensaverSettings = { DEFAULT_SETTINGS, loadSettings, saveSettings };
}
