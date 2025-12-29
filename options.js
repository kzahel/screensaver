// Run immediately since DOM is already ready when this script loads dynamically
(async () => {
  const { loadSettings, saveSettings } = window.ScreensaverSettings;

  // Core settings elements (not screensaver-specific)
  const settingsPanel = document.querySelector('.settings-panel');
  const enabledCheckbox = document.getElementById('enabled-checkbox');
  const screensaverTypeEl = document.getElementById('screensaver-type');
  const idleMinutesEl = document.getElementById('idle-minutes');
  const switchToBlackMinutesEl = document.getElementById('switch-to-black-minutes');
  const powerModeEl = document.getElementById('power-mode');
  const dimLevelEl = document.getElementById('dim-level');
  const dimLevelValueEl = document.getElementById('dim-level-value');
  const maxFramerateEl = document.getElementById('max-framerate');
  const testBtn = document.getElementById('test-btn');

  // Preview elements
  const previewContainer = document.getElementById('preview-container');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewTextContainer = document.getElementById('preview-text-container');
  const previewDimOverlay = document.getElementById('preview-dim-overlay');

  // Screensaver options container
  const screensaverOptionsEl = document.getElementById('screensaver-options');

  let activePreview = null;
  let currentPreviewType = null;
  let settings = null;

  // Initialize options generator
  OptionsGenerator.init('screensaver-options');
  OptionsGenerator.generateDropdown(screensaverTypeEl);

  // Load and apply settings
  settings = await loadSettings();

  enabledCheckbox.checked = settings.enabled;
  screensaverTypeEl.value = settings.screensaverType;
  idleMinutesEl.value = settings.idleMinutes;
  switchToBlackMinutesEl.value = settings.switchToBlackMinutes;
  powerModeEl.value = settings.powerMode;
  dimLevelEl.value = settings.dimLevel;
  dimLevelValueEl.textContent = `${settings.dimLevel}%`;
  maxFramerateEl.value = settings.maxFramerate;

  updateEnabledState();
  updateOptionsUI();
  updatePreview();

  function updateEnabledState() {
    settingsPanel.classList.toggle('disabled', !enabledCheckbox.checked);
  }

  function updateOptionsUI() {
    const type = screensaverTypeEl.value;

    // Generate UI for this screensaver type
    OptionsGenerator.generateOptionsUI(type);

    // Apply saved settings for this type
    if (settings[type]) {
      OptionsGenerator.setValues(settings[type]);
    }

    // Show/hide container based on whether there are options
    const config = ScreensaverRegistry.get(type);
    const hasOptions = config && Object.keys(config.options).length > 0;
    screensaverOptionsEl.classList.toggle('visible', hasOptions);

    // Attach change listeners
    OptionsGenerator.attachListeners(() => {
      destroyPreview();
      updatePreview();
      save();
    });
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

    // For random, pick first screensaver for preview
    if (type === 'random') {
      const types = ScreensaverRegistry.list();
      type = types.length > 0 ? types[0] : 'black';
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

      const config = ScreensaverRegistry.get(type);
      if (!config) return;

      const { width, height } = getPreviewDimensions();
      const opts = OptionsGenerator.getValues();

      // Text screensaver has special init signature (legacy)
      if (type === 'text') {
        previewCanvas.style.display = 'none';
        activePreview = config.module;
        activePreview.init({ text: opts }, {
          container: previewTextContainer,
          previewMode: true,
          idPrefix: 'preview-'
        });
      } else if (config.canvas) {
        previewCanvas.style.display = 'block';
        activePreview = config.module;
        activePreview.init({
          canvas: previewCanvas,
          width: width,
          height: height,
          maxFramerate: parseInt(maxFramerateEl.value) || 0,
          ...opts
        });
      }
    } else if (type === 'text' && activePreview) {
      // Just update text content without restarting
      activePreview.settings = OptionsGenerator.getValues();
      activePreview.updateContent();
    }
  }

  function getCurrentSettings() {
    const type = screensaverTypeEl.value;
    const baseSettings = {
      enabled: enabledCheckbox.checked,
      screensaverType: type,
      idleMinutes: parseInt(idleMinutesEl.value) || 5,
      switchToBlackMinutes: parseInt(switchToBlackMinutesEl.value) || 0,
      dimLevel: parseInt(dimLevelEl.value) || 0,
      powerMode: powerModeEl.value,
      maxFramerate: parseInt(maxFramerateEl.value) || 0
    };

    // Get screensaver-specific settings from generator
    const screensaverOpts = OptionsGenerator.getValues();
    if (type !== 'random' && type !== 'black' && Object.keys(screensaverOpts).length > 0) {
      baseSettings[type] = screensaverOpts;
    }

    // Preserve settings for other screensavers
    for (const ssType of ScreensaverRegistry.list()) {
      if (ssType !== type && settings[ssType]) {
        baseSettings[ssType] = settings[ssType];
      }
    }

    return baseSettings;
  }

  async function save() {
    const newSettings = getCurrentSettings();
    newSettings.idleMinutes = Math.max(1, Math.min(60, newSettings.idleMinutes));
    newSettings.switchToBlackMinutes = Math.max(0, Math.min(60, newSettings.switchToBlackMinutes));

    // Update local settings cache
    settings = newSettings;

    await saveSettings(newSettings);

    chrome.runtime.sendMessage({
      type: 'settingsChanged',
      enabled: newSettings.enabled,
      powerMode: newSettings.powerMode,
      idleMinutes: newSettings.idleMinutes
    });
  }

  // Event listeners for core settings
  enabledCheckbox.addEventListener('change', () => {
    updateEnabledState();
    save();
  });

  screensaverTypeEl.addEventListener('change', () => {
    updateOptionsUI();
    destroyPreview();
    updatePreview();
    save();
  });

  idleMinutesEl.addEventListener('change', save);
  switchToBlackMinutesEl.addEventListener('change', save);
  powerModeEl.addEventListener('change', save);
  maxFramerateEl.addEventListener('change', () => {
    destroyPreview();
    updatePreview();
    save();
  });

  dimLevelEl.addEventListener('input', () => {
    dimLevelValueEl.textContent = `${dimLevelEl.value}%`;
    previewDimOverlay.style.opacity = dimLevelEl.value / 100;
    save();
  });

  testBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'testScreensaver' });
  });

  // Handle window resize for preview
  window.addEventListener('resize', () => {
    const config = ScreensaverRegistry.get(currentPreviewType);
    if (config?.canvas && activePreview) {
      destroyPreview();
      updatePreview();
    }
  });
})();
