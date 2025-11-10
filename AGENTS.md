# AGENTS.md - BookmarkMind Development Guide

## Commands

### Initial Setup
```bash
# No dependencies to install - pure vanilla JS Chrome extension
git clone <repository-url>
cd BookmarkMind--AI-Powered-Chrome-Bookmark-Organizer
```

### Build
```bash
npm run build  # No build needed - vanilla JS
```

### Lint
```bash
npm run lint  # Not configured
```

### Tests
```bash
npm run test  # Not implemented
```

### Dev Server / Load Extension
1. Open Chrome at `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the repo directory
4. Extension runs directly from source files

## Tech Stack & Architecture

- **Manifest V3** Chrome extension with vanilla JavaScript (ES6+)
- **Core modules**: Service worker (`scripts/background.js`), popup UI (`popup/`), options page (`options/`)
- **AI Integration**: Google Gemini API (primary) + AgentRouter (fallback)
- **Storage**: Chrome Storage API (sync & local)
- **Scripts**: `aiProcessor.js`, `categorizer.js`, `bookmarkService.js`, `folderManager.js`, `folderConsolidator.js`

## Code Style & Conventions

- Pure vanilla JS - no frameworks or build tools
- Modular class-based architecture with JSDoc comments
- Async/await for asynchronous operations
- Chrome Extension APIs for bookmarks, storage, and messaging
- Service worker pattern for background processing
