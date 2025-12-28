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
  },
  starfield: {
    starDensity: 200,
    warpSpeed: 5
  },
  mystify: {
    numPolygons: 2,
    numVertices: 4,
    trailLength: 50
  },
  pyro: {
    launchFrequency: 5,
    explosionSize: 'medium',
    colorMode: 'rainbow',
    gravity: 1.0
  }
};

async function loadSettings() {
  const [syncResult, localResult] = await Promise.all([
    chrome.storage.sync.get('settings'),
    chrome.storage.local.get('enabled')
  ]);
  return {
    enabled: localResult.enabled ?? true, // Local only, not synced
    ...DEFAULT_SETTINGS,
    ...syncResult.settings,
    text: {
      ...DEFAULT_SETTINGS.text,
      ...(syncResult.settings?.text || {})
    },
    starfield: {
      ...DEFAULT_SETTINGS.starfield,
      ...(syncResult.settings?.starfield || {})
    },
    mystify: {
      ...DEFAULT_SETTINGS.mystify,
      ...(syncResult.settings?.mystify || {})
    },
    pyro: {
      ...DEFAULT_SETTINGS.pyro,
      ...(syncResult.settings?.pyro || {})
    }
  };
}

async function saveSettings(settings) {
  const { enabled, ...syncSettings } = settings;
  await Promise.all([
    chrome.storage.sync.set({ settings: syncSettings }),
    chrome.storage.local.set({ enabled })
  ]);
}

if (typeof window !== 'undefined') {
  window.ScreensaverSettings = { DEFAULT_SETTINGS, loadSettings, saveSettings };
}
