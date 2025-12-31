# CLAUDE.md

This file provides guidance to AI agents working on this codebase.

## Build & Test Commands

- **Run all tests**: `npm test`
- **Run unit tests only**: `npm run test:unit`
- **Run e2e tests only**: `npm run test:e2e`

## Important Guidelines

**Always run tests after making changes.** This project has unit tests that verify core functionality. Before considering any task complete:

1. Run `npm run test:unit` to ensure unit tests pass
2. If you modified settings/storage logic, pay special attention to `storage.test.js`
3. If you modified background script logic, check `background.test.js` and `background-logic.test.js`

## Architecture Notes

- **ScreensaverRegistry** (`registry.js`): Central registry for screensaver modules. Each screensaver self-registers with metadata and default options.
- **Storage** (`storage.js`): Settings management using `CORE_DEFAULTS` for core settings and `getDefaultSettings()` which merges registry defaults.
- **Screensavers** (`screensavers/*.js`): Individual screensaver implementations that register themselves with the registry.

## Test Structure

- `tests/unit/` - Unit tests using Jest
- `tests/e2e/` - End-to-end tests using Puppeteer
- `tests/setup.js` - Jest setup with Chrome API mocks
