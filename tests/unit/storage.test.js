const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('storage.js', () => {
  let loadSettings, saveSettings, DEFAULT_SETTINGS;

  beforeEach(() => {
    jest.resetModules();

    const context = {
      window: {},
      chrome: global.chrome,
      console: console
    };
    vm.createContext(context);

    const storageCode = fs.readFileSync(
      path.join(__dirname, '../../storage.js'),
      'utf8'
    );
    vm.runInContext(storageCode, context);

    ({ loadSettings, saveSettings, DEFAULT_SETTINGS } = context.window.ScreensaverSettings);
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SETTINGS).toEqual({
        screensaverType: 'black',
        powerMode: 'normal',
        idleMinutes: 5,
        switchToBlackMinutes: 0,
        text: {
          showTime: true,
          showDate: true,
          customText: '',
          showQuotes: true
        }
      });
    });
  });

  describe('loadSettings', () => {
    it('should return default settings when storage is empty', async () => {
      chrome.storage.sync.get.mockResolvedValue({});

      const settings = await loadSettings();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith('settings');
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge stored settings with defaults', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        settings: {
          screensaverType: 'pipes',
          powerMode: 'display'
        }
      });

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

      const settings = await loadSettings();

      expect(settings.text.showTime).toBe(false);
      expect(settings.text.customText).toBe('Hello World');
      expect(settings.text.showDate).toBe(true);
      expect(settings.text.showQuotes).toBe(true);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to chrome.storage.sync', async () => {
      const newSettings = {
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

      await saveSettings(newSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ settings: newSettings });
    });
  });
});
