const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const extensionPath = path.resolve(__dirname, '..');
const storeAssetsDir = path.join(extensionPath, 'store-assets');

async function generateScreenshots() {
  console.log('Generating store screenshots...');

  // Ensure output directory exists
  if (!fs.existsSync(storeAssetsDir)) {
    fs.mkdirSync(storeAssetsDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });

  // Get extension ID
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const extensionId = background.url().split('/')[2];
  console.log(`Extension ID: ${extensionId}`);

  // Screenshot 1: Text screensaver with options visible
  console.log('Capturing text screensaver screenshot...');
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 1280, height: 800 });
  await page1.goto(`chrome-extension://${extensionId}/options.html`);
  await page1.waitForLoadState('networkidle');

  // Set up attractive demo state
  await page1.locator('#enabled-checkbox').check();
  await page1.locator('#screensaver-type').selectOption('text');
  await page1.locator('#show-time').check();
  await page1.locator('#show-date').check();
  await page1.locator('#show-quotes').check();

  // Wait for preview to update
  await page1.waitForTimeout(1000);

  await page1.screenshot({
    path: path.join(storeAssetsDir, 'screenshot-text-1280x800.png'),
  });
  console.log('  Saved screenshot-text-1280x800.png');
  await page1.close();

  // Screenshot 2: Pipes screensaver
  console.log('Capturing pipes screensaver screenshot...');
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 1280, height: 800 });
  await page2.goto(`chrome-extension://${extensionId}/options.html`);
  await page2.waitForLoadState('networkidle');

  await page2.locator('#enabled-checkbox').check();
  await page2.locator('#screensaver-type').selectOption('pipes');

  // Wait for pipes animation to render
  await page2.waitForTimeout(2000);

  await page2.screenshot({
    path: path.join(storeAssetsDir, 'screenshot-pipes-1280x800.png'),
  });
  console.log('  Saved screenshot-pipes-1280x800.png');
  await page2.close();

  await context.close();
  console.log('Done!');
}

generateScreenshots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
