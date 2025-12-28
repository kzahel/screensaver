# OLED Screensaver

A Chrome extension that protects OLED screens from burn-in by automatically launching customizable screensavers when your system goes idle.

## Features

- **Idle Detection** - Automatically activates after configurable idle time (1-60 minutes)
- **Multiple Screensaver Types**
  - Black Screen - Pure black for maximum OLED protection
  - Text Mode - Displays time, date, custom text, and inspirational quotes
  - Pipes - Classic Windows 95-style animated pipes
  - Starfield - Space-themed star animation
  - Random - Randomly selects from available screensavers
- **Power Management** - Options to keep screen on or keep system awake
- **Screen Dimming** - Adjustable dimming overlay (0-90%)
- **Auto-Switch to Black** - Gradually transition to pure black after a set time
- **Settings Sync** - Configuration syncs across Chrome browsers

## Installation

### From Chrome Web Store

Install from the [Chrome Web Store](https://chrome.google.com/webstore) (search for "OLED Screensaver").

### Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/screensaver.git
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the cloned directory

## Usage

1. Click the extension icon in Chrome's toolbar
2. Configure your preferred settings:
   - **Screensaver Type** - Choose your preferred visual
   - **Idle Time** - Set how long before the screensaver activates
   - **Power Mode** - Control sleep behavior
   - **Dimming** - Adjust screen brightness reduction
3. The screensaver will automatically activate after your system is idle
4. Move your mouse or press any key to exit the screensaver

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Screensaver Type | Visual style (black, text, pipes, starfield, random) | black |
| Idle Minutes | Time before activation | 5 |
| Power Mode | normal / keep display on / keep system awake | normal |
| Dim Level | Screen dimming percentage | 0% |
| Switch to Black | Minutes before switching to black screen (0 = disabled) | 0 |

### Text Mode Options

- Show/hide time and date
- Enable inspirational quotes
- Add custom text messages

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e
```

### Building

```bash
# Generate icons
npm run generate:icons

# Package for distribution
npm run package
```

## Project Structure

```
├── manifest.json          # Chrome extension manifest (v3)
├── background.js          # Service worker for idle detection
├── background-logic.js    # Background helper functions
├── storage.js             # Settings management
├── options.html/js/css    # Settings page
├── screensaver.html/js    # Screensaver display
├── screensavers/          # Individual screensaver implementations
│   ├── text.js
│   ├── pipes.js
│   └── starfield.js
└── tests/
    ├── unit/              # Jest unit tests
    └── e2e/               # Playwright E2E tests
```

## Contributing

Contributions are welcome! See [SCREENSAVER_CATALOG.md](SCREENSAVER_CATALOG.md) for planned screensaver implementations and ideas.

## License

MIT License
