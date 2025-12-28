const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('background.js message handlers', () => {
  let messageListener;

  beforeEach(() => {
    jest.resetModules();

    // Capture message listener
    chrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });

    chrome.storage.sync.get.mockImplementation((key, callback) => {
      if (callback) callback({});
    });

    chrome.idle.queryState.mockImplementation((threshold, callback) => {
      callback('active');
    });

    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const context = {
      chrome: global.chrome,
      console: console,
      setInterval: jest.fn(),
      setTimeout: setTimeout,
      Date: Date
    };
    vm.createContext(context);

    const backgroundCode = fs.readFileSync(
      path.join(__dirname, '../../background.js'),
      'utf8'
    );
    vm.runInContext(backgroundCode, context);
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('settingsChanged message', () => {
    it('should update power mode to display', () => {
      messageListener(
        { type: 'settingsChanged', powerMode: 'display' },
        { tab: { id: 1 } }
      );

      expect(chrome.power.releaseKeepAwake).toHaveBeenCalled();
      expect(chrome.power.requestKeepAwake).toHaveBeenCalledWith('display');
    });

    it('should update power mode to system', () => {
      messageListener(
        { type: 'settingsChanged', powerMode: 'system' },
        { tab: { id: 1 } }
      );

      expect(chrome.power.releaseKeepAwake).toHaveBeenCalled();
      expect(chrome.power.requestKeepAwake).toHaveBeenCalledWith('system');
    });

    it('should release keep awake for normal mode', () => {
      chrome.power.requestKeepAwake.mockClear();

      messageListener(
        { type: 'settingsChanged', powerMode: 'normal' },
        { tab: { id: 1 } }
      );

      expect(chrome.power.releaseKeepAwake).toHaveBeenCalled();
      expect(chrome.power.requestKeepAwake).not.toHaveBeenCalled();
    });
  });

  describe('testScreensaver message', () => {
    it('should launch screensaver window', async () => {
      messageListener(
        { type: 'testScreensaver' },
        { tab: { id: 1 } }
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/screensaver.html',
        state: 'fullscreen',
        type: 'popup'
      });
    });
  });

  describe('closeScreensaver message', () => {
    it('should close the screensaver window', () => {
      const sender = { tab: { id: 1, windowId: 456 } };

      messageListener(
        { type: 'closeScreensaver' },
        sender
      );

      expect(chrome.windows.remove).toHaveBeenCalledWith(456);
    });

    it('should not close if no sender tab', () => {
      messageListener(
        { type: 'closeScreensaver' },
        {}
      );

      expect(chrome.windows.remove).not.toHaveBeenCalled();
    });
  });
});
