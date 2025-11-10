# AGENTS.md - BookmarkMind Developer Guide

## Commands

### Initial Setup
No package installation or virtual environment needed - pure vanilla JS extension.

### Build
`npm run build` (no build step required)

### Lint
`npm run lint` (not configured yet)

### Tests
`npm run test` (not implemented yet)

### Dev Server
Load extension in Chrome at `chrome://extensions/` in Developer Mode using "Load unpacked"

## Tech Stack & Architecture

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Platform**: Chrome Extension Manifest V3
- **AI**: Google Gemini API (primary), AgentRouter API (fallback)
- **Storage**: Chrome Storage API (sync & local)
- **Architecture**: Modular service-based design with service worker background script

## Repo Structure

- `scripts/` - Core logic (background.js service worker, AI processor, categorizer, folder manager, bookmark service)
- `popup/` - Extension popup UI (HTML, CSS, JS)
- `options/` - Settings page (HTML, CSS, JS)
- `icons/` - Extension icons

## Code Style

- ES6+ JavaScript with async/await patterns
- JSDoc comments for classes and complex functions
- Modular class-based architecture
- No build tools - direct browser execution
