# AGENTS.md - BookmarkMind Extension

## Commands

**Setup:** No package installation needed. Load extension in Chrome at `chrome://extensions/` (enable Developer mode → Load unpacked)

**Build:** `npm run build` (no-op for vanilla JS)

**Lint:** `npm run lint` (not configured)

**Test:** `npm run test` (not implemented)

**Dev Server:** Load extension at `chrome://extensions/` and click reload icon after changes

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **APIs:** Chrome Extension Manifest V3, Chrome Bookmarks API, Chrome Storage API
- **AI:** Google Gemini API (primary), AgentRouter API (fallback)
- **Architecture:** Service Worker background script, popup UI, options page

## Repo Structure

- `scripts/` - Core modules: background.js (service worker), aiProcessor.js, categorizer.js, bookmarkService.js, folderManager.js, snapshotManager.js, analyticsService.js, learningService.js
- `popup/` - Extension popup UI (popup.html, popup.js, popup.css)
- `options/` - Settings page (options.html, options.js, options.css)
- `icons/` - Extension icons
- `manifest.json` - Extension manifest (MV3)

## Code Conventions

- Use classes for modules (e.g., `class Categorizer`, `class BookmarkService`)
- Async/await for asynchronous operations
- JSDoc comments for public methods
- importScripts() in background.js for service worker module loading
- Chrome API promises (chrome.bookmarks, chrome.storage)
- Modular architecture with clear separation of concerns
