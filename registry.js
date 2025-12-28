// Central registry for screensaver modules
// Each screensaver self-registers with its metadata

const ScreensaverRegistry = {
  _screensavers: {},
  _order: [], // Preserve registration order

  register(type, config) {
    this._screensavers[type] = {
      type,
      name: config.name,
      module: config.module,
      canvas: config.canvas !== false, // default true
      options: config.options || {}
    };
    if (!this._order.includes(type)) {
      this._order.push(type);
    }
  },

  get(type) {
    return this._screensavers[type];
  },

  list() {
    return [...this._order];
  },

  listWithBlack() {
    return ['black', ...this._order];
  },

  getDefaults(type) {
    const config = this._screensavers[type];
    if (!config) return {};
    const defaults = {};
    for (const [key, opt] of Object.entries(config.options)) {
      defaults[key] = opt.default;
    }
    return defaults;
  },

  getAllDefaults() {
    const result = {};
    for (const type of this._order) {
      result[type] = this.getDefaults(type);
    }
    return result;
  }
};

if (typeof window !== 'undefined') {
  window.ScreensaverRegistry = ScreensaverRegistry;
}
