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
    await page.evaluate(() => chrome.storage.sync.clear());
    await page.close();
  });

  test('should load options page with default settings', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await expect(page.locator('h1')).toHaveText('OLED Screensaver');

    const screensaverType = page.locator('#screensaver-type');
    await expect(screensaverType).toHaveValue('black');

    const powerMode = page.locator('#power-mode');
    await expect(powerMode).toHaveValue('normal');

    await expect(page.locator('#test-btn')).toBeVisible();

    await page.close();
  });

  test('should show text options only for text/random screensaver types', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    const textOptions = page.locator('#text-options');
    const screensaverType = page.locator('#screensaver-type');

    await expect(textOptions).not.toHaveClass(/visible/);

    await screensaverType.selectOption('text');
    await expect(textOptions).toHaveClass(/visible/);

    await screensaverType.selectOption('pipes');
    await expect(textOptions).not.toHaveClass(/visible/);

    await screensaverType.selectOption('random');
    await expect(textOptions).toHaveClass(/visible/);

    await page.close();
  });

  test('should persist settings to storage', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await page.locator('#screensaver-type').selectOption('text');
    await expect(page.locator('#text-options')).toHaveClass(/visible/);
    await page.locator('#power-mode').selectOption('display');
    await page.locator('#show-time').uncheck();
    await page.locator('#custom-text').fill('Test Message');

    await page.waitForTimeout(300);

    await page.reload();

    await expect(page.locator('#screensaver-type')).toHaveValue('text');
    await expect(page.locator('#text-options')).toHaveClass(/visible/);
    await expect(page.locator('#power-mode')).toHaveValue('display');
    await expect(page.locator('#show-time')).not.toBeChecked();
    await expect(page.locator('#custom-text')).toHaveValue('Test Message');

    await page.close();
  });

  test('should have working checkboxes in text options', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await page.locator('#screensaver-type').selectOption('text');

    await expect(page.locator('#show-time')).toBeChecked();
    await expect(page.locator('#show-date')).toBeChecked();
    await expect(page.locator('#show-quotes')).toBeChecked();

    await page.locator('#show-time').click();
    await expect(page.locator('#show-time')).not.toBeChecked();

    await page.locator('#show-date').click();
    await expect(page.locator('#show-date')).not.toBeChecked();

    await page.close();
  });
});
