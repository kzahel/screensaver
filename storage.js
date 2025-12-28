// Core settings (not screensaver-specific)
const CORE_DEFAULTS = {
  screensaverType: 'black',
  powerMode: 'normal',
  idleMinutes: 5,
  switchToBlackMinutes: 0,
  dimLevel: 0
};

// Get all defaults including screensaver-specific options from registry
function getDefaultSettings() {
  const defaults = { ...CORE_DEFAULTS };

  // Add screensaver defaults from registry if available
  if (typeof ScreensaverRegistry !== 'undefined') {
    const screensaverDefaults = ScreensaverRegistry.getAllDefaults();
    Object.assign(defaults, screensaverDefaults);
  }

  return defaults;
}

async function loadSettings() {
  const defaults = getDefaultSettings();

  const [syncResult, localResult] = await Promise.all([
    chrome.storage.sync.get('settings'),
    chrome.storage.local.get('enabled')
  ]);

  const saved = syncResult.settings || {};

  // Start with defaults and saved top-level settings
  const merged = {
    enabled: localResult.enabled ?? true,
    ...defaults,
    ...saved
  };

  // Deep merge each screensaver's settings from registry
  if (typeof ScreensaverRegistry !== 'undefined') {
    for (const type of ScreensaverRegistry.list()) {
      merged[type] = {
        ...ScreensaverRegistry.getDefaults(type),
        ...(saved[type] || {})
      };
    }
  }

  return merged;
}

async function saveSettings(settings) {
  const { enabled, ...syncSettings } = settings;
  await Promise.all([
    chrome.storage.sync.set({ settings: syncSettings }),
    chrome.storage.local.set({ enabled })
  ]);
}

if (typeof window !== 'undefined') {
  window.ScreensaverSettings = { CORE_DEFAULTS, getDefaultSettings, loadSettings, saveSettings };
}
