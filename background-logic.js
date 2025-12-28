// Pure functions and testable logic extracted from background.js

const DEFAULT_IDLE_THRESHOLD_SECONDS = 300; // 5 minutes

/**
 * Calculate idle threshold in seconds from minutes.
 * Enforces minimum of 60 seconds (1 minute).
 */
function calculateIdleThreshold(minutes) {
  return Math.max(60, minutes * 60);
}

/**
 * Determine if idle threshold should be updated.
 * Returns { shouldUpdate, newThreshold }
 */
function shouldUpdateIdleThreshold(minutes, currentThreshold, force = false) {
  const newThreshold = calculateIdleThreshold(minutes);
  const shouldUpdate = force || newThreshold !== currentThreshold;
  return { shouldUpdate, newThreshold };
}

/**
 * Process loaded settings and return initialization actions.
 * Pure function - no side effects.
 */
function processInitialSettings(syncSettings, localEnabled, defaultIdleMinutes = 5) {
  const enabled = localEnabled ?? true;
  const actions = [];

  if (enabled) {
    if (syncSettings?.powerMode) {
      actions.push({ type: 'setPowerMode', mode: syncSettings.powerMode });
    }
    // Always set idle threshold on init - this was the bug!
    const minutes = syncSettings?.idleMinutes || defaultIdleMinutes;
    actions.push({ type: 'setIdleThreshold', minutes, force: true });
  } else {
    actions.push({ type: 'disable' });
  }

  return { enabled, actions };
}

/**
 * Process settings changed message and return actions.
 */
function processSettingsChange(message, currentEnabled) {
  const actions = [];
  const enabled = message.enabled;

  if (enabled) {
    actions.push({ type: 'setPowerMode', mode: message.powerMode });
    if (message.idleMinutes) {
      actions.push({ type: 'setIdleThreshold', minutes: message.idleMinutes, force: false });
    }
  } else {
    actions.push({ type: 'disable' });
  }

  return { enabled, actions };
}

// Export for testing and use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_IDLE_THRESHOLD_SECONDS,
    calculateIdleThreshold,
    shouldUpdateIdleThreshold,
    processInitialSettings,
    processSettingsChange
  };
}

if (typeof window !== 'undefined') {
  window.BackgroundLogic = {
    DEFAULT_IDLE_THRESHOLD_SECONDS,
    calculateIdleThreshold,
    shouldUpdateIdleThreshold,
    processInitialSettings,
    processSettingsChange
  };
}
