document.addEventListener('DOMContentLoaded', async () => {
  const { loadSettings, saveSettings } = window.ScreensaverSettings;

  const screensaverTypeEl = document.getElementById('screensaver-type');
  const idleMinutesEl = document.getElementById('idle-minutes');
  const switchToBlackMinutesEl = document.getElementById('switch-to-black-minutes');
  const powerModeEl = document.getElementById('power-mode');
  const textOptionsEl = document.getElementById('text-options');
  const showTimeEl = document.getElementById('show-time');
  const showDateEl = document.getElementById('show-date');
  const showQuotesEl = document.getElementById('show-quotes');
  const customTextEl = document.getElementById('custom-text');
  const testBtn = document.getElementById('test-btn');

  const settings = await loadSettings();

  screensaverTypeEl.value = settings.screensaverType;
  idleMinutesEl.value = settings.idleMinutes;
  switchToBlackMinutesEl.value = settings.switchToBlackMinutes;
  powerModeEl.value = settings.powerMode;
  showTimeEl.checked = settings.text.showTime;
  showDateEl.checked = settings.text.showDate;
  showQuotesEl.checked = settings.text.showQuotes;
  customTextEl.value = settings.text.customText;

  updateTextOptionsVisibility();

  function updateTextOptionsVisibility() {
    const showText = screensaverTypeEl.value === 'text' || screensaverTypeEl.value === 'random';
    textOptionsEl.classList.toggle('visible', showText);
  }

  async function save() {
    const idleMinutes = Math.max(1, Math.min(60, parseInt(idleMinutesEl.value) || 5));
    const switchToBlackMinutes = Math.max(0, Math.min(60, parseInt(switchToBlackMinutesEl.value) || 0));

    const newSettings = {
      screensaverType: screensaverTypeEl.value,
      idleMinutes,
      switchToBlackMinutes,
      powerMode: powerModeEl.value,
      text: {
        showTime: showTimeEl.checked,
        showDate: showDateEl.checked,
        showQuotes: showQuotesEl.checked,
        customText: customTextEl.value
      }
    };
    await saveSettings(newSettings);

    chrome.runtime.sendMessage({
      type: 'settingsChanged',
      powerMode: newSettings.powerMode,
      idleMinutes: newSettings.idleMinutes
    });
  }

  screensaverTypeEl.addEventListener('change', () => {
    updateTextOptionsVisibility();
    save();
  });

  idleMinutesEl.addEventListener('change', save);
  switchToBlackMinutesEl.addEventListener('change', save);
  powerModeEl.addEventListener('change', save);
  showTimeEl.addEventListener('change', save);
  showDateEl.addEventListener('change', save);
  showQuotesEl.addEventListener('change', save);
  customTextEl.addEventListener('input', save);

  testBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'testScreensaver' });
    window.close();
  });
});
