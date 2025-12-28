const {
  DEFAULT_IDLE_THRESHOLD_SECONDS,
  calculateIdleThreshold,
  shouldUpdateIdleThreshold,
  processInitialSettings,
  processSettingsChange
} = require('../../background-logic.js');

describe('background-logic', () => {
  describe('calculateIdleThreshold', () => {
    it('converts minutes to seconds', () => {
      expect(calculateIdleThreshold(5)).toBe(300);
      expect(calculateIdleThreshold(10)).toBe(600);
    });

    it('enforces minimum of 60 seconds', () => {
      expect(calculateIdleThreshold(0)).toBe(60);
      expect(calculateIdleThreshold(0.5)).toBe(60);
      expect(calculateIdleThreshold(1)).toBe(60);
    });
  });

  describe('shouldUpdateIdleThreshold', () => {
    it('returns shouldUpdate=true when threshold changes', () => {
      const result = shouldUpdateIdleThreshold(1, 300);
      expect(result).toEqual({ shouldUpdate: true, newThreshold: 60 });
    });

    it('returns shouldUpdate=false when threshold unchanged', () => {
      const result = shouldUpdateIdleThreshold(5, 300);
      expect(result).toEqual({ shouldUpdate: false, newThreshold: 300 });
    });

    it('returns shouldUpdate=true when force=true even if unchanged', () => {
      const result = shouldUpdateIdleThreshold(5, 300, true);
      expect(result).toEqual({ shouldUpdate: true, newThreshold: 300 });
    });

    // THIS TEST CATCHES THE BUG!
    it('with force=true, always updates even with default values', () => {
      // Bug scenario: default is 300, settings load with 5 minutes (also 300)
      // Without force, setDetectionInterval would never be called
      const result = shouldUpdateIdleThreshold(5, DEFAULT_IDLE_THRESHOLD_SECONDS, true);
      expect(result.shouldUpdate).toBe(true);
    });
  });

  describe('processInitialSettings', () => {
    // THIS TEST CATCHES THE BUG!
    it('always emits setIdleThreshold with force=true on init', () => {
      // Even with empty settings, we must call setDetectionInterval
      const { actions } = processInitialSettings({}, true);

      const idleAction = actions.find(a => a.type === 'setIdleThreshold');
      expect(idleAction).toBeDefined();
      expect(idleAction.force).toBe(true);
      expect(idleAction.minutes).toBe(5); // default
    });

    it('uses saved idleMinutes when available', () => {
      const { actions } = processInitialSettings({ idleMinutes: 1 }, true);

      const idleAction = actions.find(a => a.type === 'setIdleThreshold');
      expect(idleAction.minutes).toBe(1);
      expect(idleAction.force).toBe(true);
    });

    it('sets power mode when specified in settings', () => {
      const { actions } = processInitialSettings({ powerMode: 'display' }, true);

      const powerAction = actions.find(a => a.type === 'setPowerMode');
      expect(powerAction).toEqual({ type: 'setPowerMode', mode: 'display' });
    });

    it('disables when enabled=false', () => {
      const { enabled, actions } = processInitialSettings({}, false);

      expect(enabled).toBe(false);
      expect(actions).toEqual([{ type: 'disable' }]);
    });

    it('defaults to enabled when localEnabled is undefined', () => {
      const { enabled } = processInitialSettings({}, undefined);
      expect(enabled).toBe(true);
    });
  });

  describe('processSettingsChange', () => {
    it('does not force idle threshold update on settings change', () => {
      const { actions } = processSettingsChange({
        enabled: true,
        powerMode: 'normal',
        idleMinutes: 2
      });

      const idleAction = actions.find(a => a.type === 'setIdleThreshold');
      expect(idleAction.force).toBe(false); // Not forced on change, only on init
    });

    it('skips idle threshold if idleMinutes not in message', () => {
      const { actions } = processSettingsChange({
        enabled: true,
        powerMode: 'normal'
      });

      const idleAction = actions.find(a => a.type === 'setIdleThreshold');
      expect(idleAction).toBeUndefined();
    });
  });
});
