const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('storage.js', () => {
  let loadSettings, saveSettings, CORE_DEFAULTS, getDefaultSettings;

  // Mock ScreensaverRegistry for tests
  const mockRegistry = {
    _screensavers: {
      text: {
        options: {
          showTime: { default: true },
          showDate: { default: true },
          showQuotes: { default: true },
          customText: { default: '' }
        }
      },
      starfield: {
        options: {
          starDensity: { default: 200 },
          warpSpeed: { default: 5 }
        }
      }
    },
    list() {
      return ['text', 'starfield'];
    },
    getDefaults(type) {
      const config = this._screensavers[type];
      if (!config) return {};
      const defaults = {};
      for (const [key, opt] of Object.entries(config.options)) {
        defaults[key] = opt.default;
      }
      return defaults;
    },
    getAllDefaults() {
      const result = {};
      for (const type of this.list()) {
        result[type] = this.getDefaults(type);
      }
      return result;
    }
  };

  beforeEach(() => {
    jest.resetModules();

    const context = {
      window: {},
      chrome: global.chrome,
      console: console,
      ScreensaverRegistry: mockRegistry
    };
    vm.createContext(context);

    const storageCode = fs.readFileSync(
      path.join(__dirname, '../../storage.js'),
      'utf8'
    );
    vm.runInContext(storageCode, context);

    ({ loadSettings, saveSettings, CORE_DEFAULTS, getDefaultSettings } = context.window.ScreensaverSettings);
  });

  describe('CORE_DEFAULTS', () => {
    it('should have correct default values', () => {
      expect(CORE_DEFAULTS).toEqual({
        screensaverType: 'black',
        powerMode: 'normal',
        idleMinutes: 5,
        switchToBlackMinutes: 0,
        dimLevel: 0,
        maxFramerate: 60,
        randomCycleMinutes: 0,
        enabledForRandom: null
      });
    });
  });

  describe('getDefaultSettings', () => {
    it('should combine core defaults with registry defaults', () => {
      const defaults = getDefaultSettings();
      expect(defaults).toEqual({
        screensaverType: 'black',
        powerMode: 'normal',
        idleMinutes: 5,
        switchToBlackMinutes: 0,
        dimLevel: 0,
        maxFramerate: 60,
        randomCycleMinutes: 0,
        enabledForRandom: null,
        text: {
          showTime: true,
          showDate: true,
          customText: '',
          showQuotes: true
        },
        starfield: {
          starDensity: 200,
          warpSpeed: 5
        }
      });
    });
  });

  describe('loadSettings', () => {
    it('should return default settings when storage is empty', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await loadSettings();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith('settings');
      expect(settings.enabled).toBe(true);
      expect(settings.screensaverType).toBe('black');
      expect(settings.powerMode).toBe('normal');
      expect(settings.idleMinutes).toBe(5);
      expect(settings.text).toEqual({
        showTime: true,
        showDate: true,
        customText: '',
        showQuotes: true
      });
    });

    it('should merge stored settings with defaults', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        settings: {
          screensaverType: 'pipes',
          powerMode: 'display'
        }
      });
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await loadSettings();

      expect(settings.screensaverType).toBe('pipes');
      expect(settings.powerMode).toBe('display');
      expect(settings.text.showTime).toBe(true);
      expect(settings.text.showQuotes).toBe(true);
    });

    it('should deep merge text settings', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        settings: {
          text: {
            showTime: false,
            customText: 'Hello World'
          }
        }
      });
      chrome.storage.local.get.mockResolvedValue({});

      const settings = await loadSettings();

      expect(settings.text.showTime).toBe(false);
      expect(settings.text.customText).toBe('Hello World');
      expect(settings.text.showDate).toBe(true);
      expect(settings.text.showQuotes).toBe(true);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to chrome.storage.sync and enabled to local', async () => {
      const newSettings = {
        enabled: true,
        screensaverType: 'text',
        powerMode: 'system',
        text: {
          showTime: false,
          showDate: true,
          customText: 'Test',
          showQuotes: false
        }
      };

      chrome.storage.sync.set.mockResolvedValue();
      chrome.storage.local.set.mockResolvedValue();

      await saveSettings(newSettings);

      // enabled should go to local storage, rest to sync
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        settings: {
          screensaverType: 'text',
          powerMode: 'system',
          text: {
            showTime: false,
            showDate: true,
            customText: 'Test',
            showQuotes: false
          }
        }
      });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ enabled: true });
    });
  });
});
