// Screensaver module manifest
// Add new screensavers here - this is the ONLY file to edit when adding a new screensaver

const SCREENSAVER_MODULES = [
  'text',
  'pipes',
  'starfield',
  'mystify',
  'pyro',
  'flying-toasters',
  'matrix',
  'cars1',
  'cars2',
  'cars3',
  'cars4',
  'emoji-city'
];

async function loadAllScreensavers() {
  const promises = SCREENSAVER_MODULES.map(name => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `screensavers/${name}.js`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load screensaver: ${name}`));
      document.head.appendChild(script);
    });
  });

  try {
    await Promise.all(promises);
    console.log(`Loaded ${SCREENSAVER_MODULES.length} screensavers`);
  } catch (error) {
    console.error('Error loading screensavers:', error);
  }
}

if (typeof window !== 'undefined') {
  window.SCREENSAVER_MODULES = SCREENSAVER_MODULES;
  window.loadAllScreensavers = loadAllScreensavers;
}
