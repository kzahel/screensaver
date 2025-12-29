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
  },

  /**
   * Infer the value type from an option definition.
   * Explicit valueType takes precedence, otherwise inferred from option type and default.
   * @param {Object} opt - Option definition
   * @returns {'int'|'float'|'boolean'|'string'} The inferred type
   */
  inferValueType(opt) {
    // Explicit valueType takes precedence
    if (opt.valueType) {
      return opt.valueType;
    }

    // Infer from option type
    switch (opt.type) {
      case 'checkbox':
        return 'boolean';

      case 'range':
        // If step is defined and is a decimal, use float; otherwise int
        if (opt.step && opt.step % 1 !== 0) {
          return 'float';
        }
        return 'int';

      case 'select':
        // Infer from default value type, or first value in values array
        const sampleValue = opt.default !== undefined ? opt.default : (opt.values?.[0]);
        if (typeof sampleValue === 'number') {
          return Number.isInteger(sampleValue) ? 'int' : 'float';
        }
        if (typeof sampleValue === 'boolean') {
          return 'boolean';
        }
        return 'string';

      case 'text':
      default:
        return 'string';
    }
  },

  /**
   * Parse a raw value to the correct type based on option definition.
   * @param {*} value - Raw value (possibly string from form)
   * @param {Object} opt - Option definition
   * @returns {*} Parsed value with correct type
   */
  parseValue(value, opt) {
    const valueType = this.inferValueType(opt);

    switch (valueType) {
      case 'int':
        const intVal = parseInt(value, 10);
        return isNaN(intVal) ? opt.default : intVal;

      case 'float':
        const floatVal = parseFloat(value);
        return isNaN(floatVal) ? opt.default : floatVal;

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return !!value;

      case 'string':
      default:
        return String(value);
    }
  },

  /**
   * Parse all options for a screensaver type, ensuring correct types.
   * Use this in screensaver init() to safely parse incoming options.
   * @param {string} type - Screensaver type
   * @param {Object} rawOptions - Raw options (possibly with string values)
   * @returns {Object} Options with correctly typed values
   */
  parseOptions(type, rawOptions) {
    const config = this._screensavers[type];
    if (!config) return { ...rawOptions };

    const parsed = {};
    for (const [key, opt] of Object.entries(config.options)) {
      if (rawOptions[key] !== undefined) {
        parsed[key] = this.parseValue(rawOptions[key], opt);
      } else {
        parsed[key] = opt.default;
      }
    }

    // Pass through any extra options not in the schema (like canvas, width, height)
    for (const key of Object.keys(rawOptions)) {
      if (!(key in parsed)) {
        parsed[key] = rawOptions[key];
      }
    }

    return parsed;
  }
};

if (typeof window !== 'undefined') {
  window.ScreensaverRegistry = ScreensaverRegistry;
}
