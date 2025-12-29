/**
 * TypeScript type definitions for the screensaver options system.
 * These types enable IDE intellisense and type checking for screensaver development.
 */

/** Supported value types for screensaver options */
type OptionValueType = 'int' | 'float' | 'boolean' | 'string';

/** Base option definition with common properties */
interface BaseOptionDef {
  /** Display label for the option */
  label: string;
  /** Explicit value type (optional - inferred from option type if not specified) */
  valueType?: OptionValueType;
}

/** Range slider option (produces int by default, float if step is decimal) */
interface RangeOptionDef extends BaseOptionDef {
  type: 'range';
  default: number;
  min: number;
  max: number;
  step?: number;
}

/** Dropdown select option (type inferred from default value) */
interface SelectOptionDef<T extends string | number = string | number> extends BaseOptionDef {
  type: 'select';
  default: T;
  values: T[];
  labels?: string[];
}

/** Checkbox option (always boolean) */
interface CheckboxOptionDef extends BaseOptionDef {
  type: 'checkbox';
  default: boolean;
}

/** Text input option (always string) */
interface TextOptionDef extends BaseOptionDef {
  type: 'text';
  default?: string;
  placeholder?: string;
}

/** Union of all option definition types */
type OptionDef = RangeOptionDef | SelectOptionDef | CheckboxOptionDef | TextOptionDef;

/** Map of option keys to their definitions */
interface OptionsSchema {
  [key: string]: OptionDef;
}

/** Screensaver module configuration for registry */
interface ScreensaverConfig {
  /** Display name for the screensaver */
  name: string;
  /** The screensaver module object */
  module: ScreensaverModule;
  /** Whether this screensaver uses a canvas (default: true) */
  canvas?: boolean;
  /** Option definitions */
  options: OptionsSchema;
}

/** Screensaver module interface */
interface ScreensaverModule {
  /** Initialize the screensaver with options */
  init(options: Record<string, unknown>): void;
  /** Clean up and stop the screensaver */
  destroy(): void;
  /** Canvas element (if applicable) */
  canvas?: HTMLCanvasElement;
  /** 2D rendering context (if applicable) */
  ctx?: CanvasRenderingContext2D;
}

/** Base options passed to all screensavers */
interface BaseScreensaverOptions {
  /** Canvas element (for preview mode) */
  canvas?: HTMLCanvasElement;
  /** Fixed width (for preview mode) */
  width?: number;
  /** Fixed height (for preview mode) */
  height?: number;
  /** Maximum framerate limit (0 = unlimited) */
  maxFramerate?: number;
}

/** Registry stored config */
interface StoredScreensaverConfig {
  type: string;
  name: string;
  module: ScreensaverModule;
  canvas: boolean;
  options: OptionsSchema;
}

/** Screensaver Registry interface */
interface ScreensaverRegistryType {
  /** Register a new screensaver */
  register(type: string, config: ScreensaverConfig): void;

  /** Get a screensaver config by type */
  get(type: string): StoredScreensaverConfig | undefined;

  /** List all registered screensaver types */
  list(): string[];

  /** List all types including 'black' */
  listWithBlack(): string[];

  /** Get default values for a screensaver type */
  getDefaults(type: string): Record<string, unknown>;

  /** Get defaults for all screensavers */
  getAllDefaults(): Record<string, Record<string, unknown>>;

  /** Infer the value type from an option definition */
  inferValueType(opt: OptionDef): OptionValueType;

  /** Parse a raw value to the correct type based on option definition */
  parseValue(value: unknown, opt: OptionDef): unknown;

  /** Parse all options for a screensaver type, ensuring correct types */
  parseOptions(type: string, rawOptions: Record<string, unknown>): Record<string, unknown>;
}

/** Options Generator interface */
interface OptionsGeneratorType {
  init(containerId: string): void;
  generateDropdown(selectEl: HTMLSelectElement): void;
  generateOptionsUI(type: string): void;
  getValues(): Record<string, unknown>;
  setValues(settings: Record<string, unknown>): void;
  attachListeners(onChange: () => void): void;
  resetToDefaults(): void;
}

/** Global window declarations */
declare global {
  interface Window {
    ScreensaverRegistry: ScreensaverRegistryType;
    OptionsGenerator: OptionsGeneratorType;
    SCREENSAVER_MODULES: string[];
    loadAllScreensavers: () => Promise<void>;
  }

  const ScreensaverRegistry: ScreensaverRegistryType;
  const OptionsGenerator: OptionsGeneratorType;
}

export {
  OptionValueType,
  OptionDef,
  RangeOptionDef,
  SelectOptionDef,
  CheckboxOptionDef,
  TextOptionDef,
  OptionsSchema,
  ScreensaverConfig,
  ScreensaverModule,
  BaseScreensaverOptions,
  ScreensaverRegistryType,
  OptionsGeneratorType
};
