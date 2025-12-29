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

  // Random mode elements
  const randomCycleSectionEl = document.getElementById('random-cycle-section');
  const randomPoolSectionEl = document.getElementById('random-pool-section');
  const randomCycleMinutesEl = document.getElementById('random-cycle-minutes');
  const randomPoolCheckboxesEl = document.getElementById('random-pool-checkboxes');

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
  randomCycleMinutesEl.value = settings.randomCycleMinutes;

  // Generate random pool checkboxes and apply saved settings
  generateRandomPoolCheckboxes();
  setEnabledForRandom(settings.enabledForRandom);

  updateEnabledState();
  updateRandomOptionsVisibility();
  updateOptionsUI();
  updatePreview();

  function updateEnabledState() {
    settingsPanel.classList.toggle('disabled', !enabledCheckbox.checked);
  }

  function updateRandomOptionsVisibility() {
    const isRandom = screensaverTypeEl.value === 'random';
    randomCycleSectionEl.classList.toggle('visible', isRandom);
    randomPoolSectionEl.classList.toggle('visible', isRandom);
  }

  function generateRandomPoolCheckboxes() {
    randomPoolCheckboxesEl.innerHTML = '';

    // Get all screensaver types including black
    const types = ScreensaverRegistry.listWithBlack();

    for (const type of types) {
      const label = document.createElement('label');
      label.className = 'checkbox-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `random-pool-${type}`;
      checkbox.value = type;
      checkbox.checked = true; // Default to checked

      const name = type === 'black' ? 'Black Screen' : ScreensaverRegistry.get(type)?.name || type;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${name}`));
      randomPoolCheckboxesEl.appendChild(label);

      checkbox.addEventListener('change', () => {
        // Update preview with new random selection when pool changes
        destroyPreview();
        updatePreview();
        save();
      });
    }
  }

  function getEnabledForRandom() {
    const checkboxes = randomPoolCheckboxesEl.querySelectorAll('input[type="checkbox"]');
    const enabled = [];
    let allChecked = true;

    for (const cb of checkboxes) {
      if (cb.checked) {
        enabled.push(cb.value);
      } else {
        allChecked = false;
      }
    }

    // Return null if all are checked (means "all enabled")
    return allChecked ? null : (enabled.length === 0 ? null : enabled);
  }

  function setEnabledForRandom(enabledTypes) {
    const checkboxes = randomPoolCheckboxesEl.querySelectorAll('input[type="checkbox"]');

    for (const cb of checkboxes) {
      // If enabledTypes is null, check all; otherwise check if type is in the array
      cb.checked = enabledTypes === null || enabledTypes.includes(cb.value);
    }
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

  function getRandomPreviewType() {
    let types = ScreensaverRegistry.listWithBlack();
    const enabled = getEnabledForRandom();

    // Filter by enabled screensavers if configured
    if (enabled && enabled.length > 0) {
      types = types.filter(t => enabled.includes(t));
    }

    // Fallback if filtering left us empty
    if (types.length === 0) {
      types = ScreensaverRegistry.listWithBlack();
    }

    return types[Math.floor(Math.random() * types.length)];
  }

  function updatePreview() {
    let type = screensaverTypeEl.value;

    // For random, pick a random screensaver from the enabled pool
    if (type === 'random') {
      type = getRandomPreviewType();
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
      maxFramerate: parseInt(maxFramerateEl.value) || 0,
      randomCycleMinutes: parseInt(randomCycleMinutesEl.value) || 0,
      enabledForRandom: getEnabledForRandom()
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
    newSettings.randomCycleMinutes = Math.max(0, Math.min(60, newSettings.randomCycleMinutes));

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
    updateRandomOptionsVisibility();
    updateOptionsUI();
    destroyPreview();
    updatePreview();
    save();
  });

  randomCycleMinutesEl.addEventListener('change', save);

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
