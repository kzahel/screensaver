const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

const extensionPath = path.resolve(__dirname, '../..');

test.describe('Screensaver', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    extensionId = background.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Clear storage and reset to defaults before each test
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.evaluate(() => chrome.storage.sync.clear());
    await page.waitForTimeout(100);
    await page.close();
  });

  // Helper to wait for dynamic content to load
  async function waitForDynamicLoad(page) {
    await page.waitForFunction(() => {
      const select = document.querySelector('#screensaver-type');
      return select && select.options.length > 2;
    }, { timeout: 5000 });
  }

  test('should launch screensaver via Test button', async () => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(optionsPage);

    // Set up listener before clicking
    const pagePromise = context.waitForEvent('page');
    await optionsPage.locator('#test-btn').click();
    const screensaverPage = await pagePromise;

    expect(screensaverPage.url()).toContain('screensaver.html');

    await screensaverPage.waitForTimeout(500);
    await screensaverPage.close();
  });

  test('should render black screensaver', async () => {
    // Black is the default, so just open screensaver directly
    const screensaverPage = await context.newPage();
    await screensaverPage.goto(`chrome-extension://${extensionId}/screensaver.html`);

    await screensaverPage.waitForTimeout(500);

    const canvas = screensaverPage.locator('#screensaver-canvas');
    await expect(canvas).toHaveCSS('display', 'none');

    const textContainer = screensaverPage.locator('#text-container');
    await expect(textContainer).not.toHaveClass(/visible/);

    await screensaverPage.close();
  });

  test('should render text screensaver with visible text container', async () => {
    // Configure text screensaver via options page first
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(optionsPage);
    await optionsPage.locator('#screensaver-type').selectOption('text');
    await optionsPage.waitForTimeout(200);
    await optionsPage.close();

    // Open screensaver directly to test rendering
    const screensaverPage = await context.newPage();
    await screensaverPage.goto(`chrome-extension://${extensionId}/screensaver.html`);

    await screensaverPage.waitForTimeout(1500);

    const textContainer = screensaverPage.locator('#text-container');
    await expect(textContainer).toHaveClass(/visible/);

    const canvas = screensaverPage.locator('#screensaver-canvas');
    await expect(canvas).toHaveCSS('display', 'none');

    const timeDisplay = screensaverPage.locator('#time-display');
    await expect(timeDisplay).toBeVisible();

    await screensaverPage.close();
  });

  test('should render pipes screensaver with visible canvas', async () => {
    // Configure pipes screensaver via options page first
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(optionsPage);
    await optionsPage.locator('#screensaver-type').selectOption('pipes');
    await optionsPage.waitForTimeout(200);
    await optionsPage.close();

    // Open screensaver directly to test rendering
    const screensaverPage = await context.newPage();
    await screensaverPage.goto(`chrome-extension://${extensionId}/screensaver.html`);

    await screensaverPage.waitForTimeout(500);

    const canvas = screensaverPage.locator('#screensaver-canvas');
    await expect(canvas).toHaveCSS('display', 'block');

    const textContainer = screensaverPage.locator('#text-container');
    await expect(textContainer).not.toHaveClass(/visible/);

    await screensaverPage.close();
  });

  test('should show custom text when configured', async () => {
    const customMessage = 'Hello E2E Test';

    // Configure custom text via options page first
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(optionsPage);
    await optionsPage.locator('#screensaver-type').selectOption('text');
    await expect(optionsPage.locator('#screensaver-options')).toHaveClass(/visible/);
    await optionsPage.locator('#customText').fill(customMessage);
    await optionsPage.waitForTimeout(300);
    await optionsPage.close();

    // Open screensaver directly
    const screensaverPage = await context.newPage();
    await screensaverPage.goto(`chrome-extension://${extensionId}/screensaver.html`);

    await screensaverPage.waitForTimeout(1500);

    const customTextEl = screensaverPage.locator('#custom-text');
    await expect(customTextEl).toHaveText(customMessage);

    await screensaverPage.close();
  });

  test('should respond to keypress by attempting to close', async () => {
    // Open screensaver directly
    const screensaverPage = await context.newPage();
    await screensaverPage.goto(`chrome-extension://${extensionId}/screensaver.html`);
    await screensaverPage.waitForTimeout(500);

    // Track if closeScreensaver was called
    const closeAttempted = await screensaverPage.evaluate(() => {
      return new Promise((resolve) => {
        // Override the close function to detect if it's called
        const originalSendMessage = chrome.runtime.sendMessage;
        chrome.runtime.sendMessage = (msg) => {
          if (msg.type === 'closeScreensaver') {
            resolve(true);
          }
          return originalSendMessage(msg);
        };

        // Also check window.close
        const originalClose = window.close;
        window.close = () => {
          resolve(true);
          originalClose.call(window);
        };

        // Dispatch keydown event
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        // Timeout if nothing happens
        setTimeout(() => resolve(false), 1000);
      });
    });

    expect(closeAttempted).toBe(true);
    await screensaverPage.close();
  });
});
