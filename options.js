document.addEventListener('DOMContentLoaded', async () => {
  const { loadSettings, saveSettings } = window.ScreensaverSettings;

  // Settings elements
  const settingsPanel = document.querySelector('.settings-panel');
  const enabledCheckbox = document.getElementById('enabled-checkbox');
  const screensaverTypeEl = document.getElementById('screensaver-type');
  const idleMinutesEl = document.getElementById('idle-minutes');
  const switchToBlackMinutesEl = document.getElementById('switch-to-black-minutes');
  const powerModeEl = document.getElementById('power-mode');
  const textOptionsEl = document.getElementById('text-options');
  const showTimeEl = document.getElementById('show-time');
  const showDateEl = document.getElementById('show-date');
  const showQuotesEl = document.getElementById('show-quotes');
  const customTextEl = document.getElementById('custom-text');
  const dimLevelEl = document.getElementById('dim-level');
  const dimLevelValueEl = document.getElementById('dim-level-value');
  const testBtn = document.getElementById('test-btn');

  // Starfield elements
  const starfieldOptionsEl = document.getElementById('starfield-options');
  const starDensityEl = document.getElementById('star-density');
  const warpSpeedEl = document.getElementById('warp-speed');
  const warpSpeedValueEl = document.getElementById('warp-speed-value');

  // Mystify elements
  const mystifyOptionsEl = document.getElementById('mystify-options');
  const numPolygonsEl = document.getElementById('num-polygons');
  const numVerticesEl = document.getElementById('num-vertices');
  const trailLengthEl = document.getElementById('trail-length');
  const trailLengthValueEl = document.getElementById('trail-length-value');

  // Pyro elements
  const pyroOptionsEl = document.getElementById('pyro-options');
  const launchFrequencyEl = document.getElementById('launch-frequency');
  const launchFrequencyValueEl = document.getElementById('launch-frequency-value');
  const explosionSizeEl = document.getElementById('explosion-size');
  const colorModeEl = document.getElementById('color-mode');

  // Preview elements
  const previewContainer = document.getElementById('preview-container');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewTextContainer = document.getElementById('preview-text-container');
  const previewDimOverlay = document.getElementById('preview-dim-overlay');

  let activePreview = null;
  let currentPreviewType = null;

  // Load and apply settings
  const settings = await loadSettings();

  enabledCheckbox.checked = settings.enabled;
  screensaverTypeEl.value = settings.screensaverType;
  idleMinutesEl.value = settings.idleMinutes;
  switchToBlackMinutesEl.value = settings.switchToBlackMinutes;
  powerModeEl.value = settings.powerMode;
  dimLevelEl.value = settings.dimLevel;
  dimLevelValueEl.textContent = `${settings.dimLevel}%`;
  showTimeEl.checked = settings.text.showTime;
  showDateEl.checked = settings.text.showDate;
  showQuotesEl.checked = settings.text.showQuotes;
  customTextEl.value = settings.text.customText;
  starDensityEl.value = settings.starfield?.starDensity || 200;
  warpSpeedEl.value = settings.starfield?.warpSpeed || 5;
  warpSpeedValueEl.textContent = settings.starfield?.warpSpeed || 5;
  numPolygonsEl.value = settings.mystify?.numPolygons || 2;
  numVerticesEl.value = settings.mystify?.numVertices || 4;
  trailLengthEl.value = settings.mystify?.trailLength || 50;
  trailLengthValueEl.textContent = settings.mystify?.trailLength || 50;
  launchFrequencyEl.value = settings.pyro?.launchFrequency || 5;
  launchFrequencyValueEl.textContent = settings.pyro?.launchFrequency || 5;
  explosionSizeEl.value = settings.pyro?.explosionSize || 'medium';
  colorModeEl.value = settings.pyro?.colorMode || 'rainbow';

  updateEnabledState();
  updateOptionsVisibility();
  updatePreview();

  function updateEnabledState() {
    settingsPanel.classList.toggle('disabled', !enabledCheckbox.checked);
  }

  function updateOptionsVisibility() {
    const type = screensaverTypeEl.value;
    const showText = type === 'text' || type === 'random';
    const showStarfield = type === 'starfield';
    const showMystify = type === 'mystify';
    const showPyro = type === 'pyro';
    textOptionsEl.classList.toggle('visible', showText);
    starfieldOptionsEl.classList.toggle('visible', showStarfield);
    mystifyOptionsEl.classList.toggle('visible', showMystify);
    pyroOptionsEl.classList.toggle('visible', showPyro);
  }

  function getPreviewDimensions() {
    const rect = previewContainer.getBoundingClientRect();
    return { width: Math.floor(rect.width), height: Math.floor(rect.height) };
  }

  function destroyPreview() {
    if (activePreview?.destroy) {
      activePreview.destroy();
    }
    activePreview = null;
    currentPreviewType = null;
    previewCanvas.style.display = 'none';
    previewTextContainer.classList.remove('visible');
    previewContainer.classList.remove('black-screen');
  }

  function updatePreview() {
    let type = screensaverTypeEl.value;

    // For random, pick a non-black type for preview
    if (type === 'random') {
      type = 'text'; // Default to text for random preview
    }

    // Update dim overlay
    previewDimOverlay.style.opacity = dimLevelEl.value / 100;

    // Only restart preview if type changed
    if (type !== currentPreviewType) {
      destroyPreview();
      currentPreviewType = type;

      if (type === 'black') {
        previewContainer.classList.add('black-screen');
        return;
      }

      const { width, height } = getPreviewDimensions();

      if (type === 'text') {
        previewCanvas.style.display = 'none';
        activePreview = window.TextScreensaver;
        activePreview.init(getCurrentSettings(), {
          container: previewTextContainer,
          previewMode: true,
          idPrefix: 'preview-'
        });
      } else if (type === 'pipes') {
        previewCanvas.style.display = 'block';
        activePreview = window.PipesScreensaver;
        activePreview.init({
          canvas: previewCanvas,
          width: width,
          height: height
        });
      } else if (type === 'starfield') {
        previewCanvas.style.display = 'block';
        activePreview = window.StarfieldScreensaver;
        activePreview.init({
          canvas: previewCanvas,
          width: width,
          height: height,
          starDensity: parseInt(starDensityEl.value),
          warpSpeed: parseInt(warpSpeedEl.value)
        });
      } else if (type === 'mystify') {
        previewCanvas.style.display = 'block';
        activePreview = window.MystifyScreensaver;
        activePreview.init({
          canvas: previewCanvas,
          width: width,
          height: height,
          numPolygons: parseInt(numPolygonsEl.value),
          numVertices: parseInt(numVerticesEl.value),
          trailLength: parseInt(trailLengthEl.value)
        });
      } else if (type === 'pyro') {
        previewCanvas.style.display = 'block';
        activePreview = window.PyroScreensaver;
        activePreview.init({
          canvas: previewCanvas,
          width: width,
          height: height,
          launchFrequency: parseInt(launchFrequencyEl.value),
          explosionSize: explosionSizeEl.value,
          colorMode: colorModeEl.value
        });
      }
    } else if (type === 'text' && activePreview) {
      // Just update text content without restarting
      activePreview.settings = getCurrentSettings().text;
      activePreview.updateContent();
    }
  }

  function getCurrentSettings() {
    return {
      enabled: enabledCheckbox.checked,
      screensaverType: screensaverTypeEl.value,
      idleMinutes: parseInt(idleMinutesEl.value) || 5,
      switchToBlackMinutes: parseInt(switchToBlackMinutesEl.value) || 0,
      dimLevel: parseInt(dimLevelEl.value) || 0,
      powerMode: powerModeEl.value,
      text: {
        showTime: showTimeEl.checked,
        showDate: showDateEl.checked,
        showQuotes: showQuotesEl.checked,
        customText: customTextEl.value
      },
      starfield: {
        starDensity: parseInt(starDensityEl.value) || 200,
        warpSpeed: parseInt(warpSpeedEl.value) || 5
      },
      mystify: {
        numPolygons: parseInt(numPolygonsEl.value) || 2,
        numVertices: parseInt(numVerticesEl.value) || 4,
        trailLength: parseInt(trailLengthEl.value) || 50
      },
      pyro: {
        launchFrequency: parseInt(launchFrequencyEl.value) || 5,
        explosionSize: explosionSizeEl.value || 'medium',
        colorMode: colorModeEl.value || 'rainbow'
      }
    };
  }

  async function save() {
    const newSettings = getCurrentSettings();
    newSettings.idleMinutes = Math.max(1, Math.min(60, newSettings.idleMinutes));
    newSettings.switchToBlackMinutes = Math.max(0, Math.min(60, newSettings.switchToBlackMinutes));

    await saveSettings(newSettings);

    chrome.runtime.sendMessage({
      type: 'settingsChanged',
      enabled: newSettings.enabled,
      powerMode: newSettings.powerMode,
      idleMinutes: newSettings.idleMinutes
    });
  }

  // Event listeners
  enabledCheckbox.addEventListener('change', () => {
    updateEnabledState();
    save();
  });

  screensaverTypeEl.addEventListener('change', () => {
    updateOptionsVisibility();
    updatePreview();
    save();
  });

  idleMinutesEl.addEventListener('change', save);
  switchToBlackMinutesEl.addEventListener('change', save);
  powerModeEl.addEventListener('change', save);

  showTimeEl.addEventListener('change', () => {
    updatePreview();
    save();
  });

  showDateEl.addEventListener('change', () => {
    updatePreview();
    save();
  });

  showQuotesEl.addEventListener('change', () => {
    updatePreview();
    save();
  });

  customTextEl.addEventListener('input', () => {
    updatePreview();
    save();
  });

  dimLevelEl.addEventListener('input', () => {
    dimLevelValueEl.textContent = `${dimLevelEl.value}%`;
    previewDimOverlay.style.opacity = dimLevelEl.value / 100;
    save();
  });

  starDensityEl.addEventListener('change', () => {
    destroyPreview();
    updatePreview();
    save();
  });

  warpSpeedEl.addEventListener('input', () => {
    warpSpeedValueEl.textContent = warpSpeedEl.value;
    destroyPreview();
    updatePreview();
    save();
  });

  numPolygonsEl.addEventListener('change', () => {
    destroyPreview();
    updatePreview();
    save();
  });

  numVerticesEl.addEventListener('change', () => {
    destroyPreview();
    updatePreview();
    save();
  });

  trailLengthEl.addEventListener('input', () => {
    trailLengthValueEl.textContent = trailLengthEl.value;
    destroyPreview();
    updatePreview();
    save();
  });

  launchFrequencyEl.addEventListener('input', () => {
    launchFrequencyValueEl.textContent = launchFrequencyEl.value;
    destroyPreview();
    updatePreview();
    save();
  });

  explosionSizeEl.addEventListener('change', () => {
    destroyPreview();
    updatePreview();
    save();
  });

  colorModeEl.addEventListener('change', () => {
    destroyPreview();
    updatePreview();
    save();
  });

  testBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'testScreensaver' });
  });

  // Handle window resize for preview
  window.addEventListener('resize', () => {
    if ((currentPreviewType === 'pipes' || currentPreviewType === 'starfield' || currentPreviewType === 'mystify' || currentPreviewType === 'pyro') && activePreview) {
      destroyPreview();
      updatePreview();
    }
  });
});
