// Dynamically generates options UI from screensaver registry metadata

const OptionsGenerator = {
  container: null,
  elements: {},
  currentType: null,
  onChangeCallback: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  generateDropdown(selectEl) {
    // Keep Random and Black as first options
    selectEl.innerHTML = `
      <option value="random">Random</option>
      <option value="black">Black Screen</option>
    `;

    for (const type of ScreensaverRegistry.list()) {
      const config = ScreensaverRegistry.get(type);
      const option = document.createElement('option');
      option.value = type;
      option.textContent = config.name;
      selectEl.appendChild(option);
    }
  },

  generateOptionsUI(type) {
    this.container.innerHTML = '';
    this.elements = {};
    this.currentType = type;

    if (type === 'random' || type === 'black') {
      return;
    }

    const config = ScreensaverRegistry.get(type);
    if (!config || Object.keys(config.options).length === 0) {
      return;
    }

    const header = document.createElement('h2');
    header.textContent = `${config.name} Options`;
    this.container.appendChild(header);

    for (const [key, opt] of Object.entries(config.options)) {
      const control = this.createControl(key, opt);
      if (control) {
        this.elements[key] = control;
      }
    }

    // Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'reset-button';
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.addEventListener('click', () => this.resetToDefaults());
    this.container.appendChild(resetBtn);
  },

  createControl(key, opt) {
    if (opt.type === 'range') {
      return this.createRangeControl(key, opt);
    }
    if (opt.type === 'select') {
      return this.createSelectControl(key, opt);
    }
    if (opt.type === 'checkbox') {
      return this.createCheckboxControl(key, opt);
    }
    if (opt.type === 'text') {
      return this.createTextControl(key, opt);
    }
    return null;
  },

  createRangeControl(key, opt) {
    const label = document.createElement('label');
    label.htmlFor = key;
    const valueSpan = document.createElement('span');
    valueSpan.id = `${key}-value`;
    valueSpan.textContent = opt.default;
    label.textContent = `${opt.label}: `;
    label.appendChild(valueSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.id = key;
    input.min = opt.min;
    input.max = opt.max;
    input.value = opt.default;
    if (opt.step) {
      input.step = opt.step;
    }

    this.container.appendChild(label);
    this.container.appendChild(input);

    return { input, valueSpan };
  },

  createSelectControl(key, opt) {
    const label = document.createElement('label');
    label.textContent = opt.label;
    label.htmlFor = key;

    const select = document.createElement('select');
    select.id = key;

    opt.values.forEach((val, i) => {
      const optEl = document.createElement('option');
      optEl.value = val;
      optEl.textContent = opt.labels ? opt.labels[i] : val;
      if (val === opt.default) optEl.selected = true;
      select.appendChild(optEl);
    });

    this.container.appendChild(label);
    this.container.appendChild(select);

    return { input: select };
  },

  createCheckboxControl(key, opt) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = key;
    input.checked = opt.default;
    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${opt.label}`));

    this.container.appendChild(label);

    return { input };
  },

  createTextControl(key, opt) {
    const label = document.createElement('label');
    label.textContent = opt.label;
    label.htmlFor = key;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = key;
    input.value = opt.default || '';
    if (opt.placeholder) {
      input.placeholder = opt.placeholder;
    }

    this.container.appendChild(label);
    this.container.appendChild(input);

    return { input };
  },

  getValues() {
    const config = this.currentType ? ScreensaverRegistry.get(this.currentType) : null;
    const values = {};

    for (const [key, el] of Object.entries(this.elements)) {
      if (!el || !el.input) continue;

      // Get raw value
      let rawValue;
      if (el.input.type === 'checkbox') {
        rawValue = el.input.checked;
      } else {
        rawValue = el.input.value;
      }

      // Use registry to parse with correct type if available
      if (config && config.options[key]) {
        values[key] = ScreensaverRegistry.parseValue(rawValue, config.options[key]);
      } else if (el.input.type === 'checkbox') {
        values[key] = rawValue;
      } else if (el.input.type === 'range' || el.input.type === 'number') {
        values[key] = parseFloat(rawValue);
      } else {
        values[key] = rawValue;
      }
    }
    return values;
  },

  setValues(settings) {
    if (!settings) return;

    for (const [key, el] of Object.entries(this.elements)) {
      if (!el || !el.input) continue;
      if (settings[key] === undefined) continue;

      if (el.input.type === 'checkbox') {
        el.input.checked = settings[key];
      } else {
        el.input.value = settings[key];
      }
      if (el.valueSpan) {
        el.valueSpan.textContent = settings[key];
      }
    }
  },

  attachListeners(onChange) {
    this.onChangeCallback = onChange;

    for (const [key, el] of Object.entries(this.elements)) {
      if (!el || !el.input) continue;

      const eventType = (el.input.type === 'range' || el.input.type === 'text') ? 'input' : 'change';
      el.input.addEventListener(eventType, () => {
        if (el.valueSpan) {
          el.valueSpan.textContent = el.input.value;
        }
        onChange();
      });
    }
  },

  resetToDefaults() {
    if (!this.currentType) return;

    const defaults = ScreensaverRegistry.getDefaults(this.currentType);
    this.setValues(defaults);

    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }
};

if (typeof window !== 'undefined') {
  window.OptionsGenerator = OptionsGenerator;
}
