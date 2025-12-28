const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

const extensionPath = path.resolve(__dirname, '../..');

test.describe('Options UI', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--headless=new',
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
    // Clear storage before each test to ensure isolation
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.evaluate(async () => {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
    });
    await page.close();
  });

  // Helper to wait for dynamic content to load
  async function waitForDynamicLoad(page) {
    // Wait for dropdown to have more than just Random and Black options
    await page.waitForFunction(() => {
      const select = document.querySelector('#screensaver-type');
      return select && select.options.length > 2;
    }, { timeout: 5000 });
  }

  test('should load options page with default settings', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(page);

    await expect(page.locator('h1')).toHaveText('OLED Screensaver');

    const screensaverType = page.locator('#screensaver-type');
    await expect(screensaverType).toHaveValue('black');

    const powerMode = page.locator('#power-mode');
    await expect(powerMode).toHaveValue('normal');

    await expect(page.locator('#test-btn')).toBeVisible();

    await page.close();
  });

  test('should show screensaver options only for non-black/random types', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(page);

    const screensaverOptions = page.locator('#screensaver-options');
    const screensaverType = page.locator('#screensaver-type');

    // Wait for settings to be loaded and applied (dropdown should have a value)
    await expect(screensaverType).toHaveValue('black');

    // Debug: explicitly trigger the change to ensure updateOptionsUI runs
    await screensaverType.selectOption('black');
    await page.waitForTimeout(100);

    // Default is black - no options visible
    await expect(screensaverOptions).not.toHaveClass(/visible/);

    // Select text - should show text options
    await screensaverType.selectOption('text');
    await expect(screensaverOptions).toHaveClass(/visible/);
    await expect(page.locator('#showTime')).toBeVisible();

    // Select pipes - no configurable options
    await screensaverType.selectOption('pipes');
    await expect(screensaverOptions).not.toHaveClass(/visible/);

    // Select starfield - should show starfield options
    await screensaverType.selectOption('starfield');
    await expect(screensaverOptions).toHaveClass(/visible/);
    await expect(page.locator('#starDensity')).toBeVisible();

    await page.close();
  });

  test('should persist settings to storage', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(page);

    await page.locator('#screensaver-type').selectOption('text');
    await expect(page.locator('#screensaver-options')).toHaveClass(/visible/);
    await page.locator('#power-mode').selectOption('display');
    await page.locator('#showTime').uncheck();
    await page.locator('#customText').fill('Test Message');

    await page.waitForTimeout(300);

    await page.reload();
    await waitForDynamicLoad(page);

    await expect(page.locator('#screensaver-type')).toHaveValue('text');
    await expect(page.locator('#screensaver-options')).toHaveClass(/visible/);
    await expect(page.locator('#power-mode')).toHaveValue('display');
    await expect(page.locator('#showTime')).not.toBeChecked();
    await expect(page.locator('#customText')).toHaveValue('Test Message');

    await page.close();
  });

  test('should have working checkboxes in text options', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await waitForDynamicLoad(page);

    await page.locator('#screensaver-type').selectOption('text');

    await expect(page.locator('#showTime')).toBeChecked();
    await expect(page.locator('#showDate')).toBeChecked();
    await expect(page.locator('#showQuotes')).toBeChecked();

    await page.locator('#showTime').click();
    await expect(page.locator('#showTime')).not.toBeChecked();

    await page.locator('#showDate').click();
    await expect(page.locator('#showDate')).not.toBeChecked();

    await page.close();
  });
});
