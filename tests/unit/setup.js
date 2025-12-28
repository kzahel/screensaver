// Manual Chrome API mocks
const createMockChrome = () => ({
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    },
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  },
  idle: {
    setDetectionInterval: jest.fn(),
    queryState: jest.fn((threshold, callback) => callback('active')),
    onStateChanged: {
      addListener: jest.fn()
    }
  },
  windows: {
    create: jest.fn().mockResolvedValue({ id: 123 }),
    remove: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue({}),
    onRemoved: { addListener: jest.fn() }
  },
  power: {
    requestKeepAwake: jest.fn(),
    releaseKeepAwake: jest.fn()
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  },
  tabs: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    query: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({})
  }
});

global.chrome = createMockChrome();

beforeEach(() => {
  jest.clearAllMocks();
  global.chrome = createMockChrome();
});
