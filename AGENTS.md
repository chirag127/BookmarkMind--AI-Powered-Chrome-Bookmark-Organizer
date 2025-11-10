# AGENTS.md - BookmarkMind Extension

## Commands

**Setup:** No package installation needed. Load extension in Chrome at `chrome://extensions/` (enable Developer mode → Load unpacked)

**Build:** `npm run build` (no-op for vanilla JS)

**Lint:** `npm run lint` - Runs ESLint on scripts/, popup/, and options/ directories (Note: Existing code has many style violations; use `--fix` to auto-correct)

**Test:** `npm run test` - Runs Jest tests (see TESTING.md)

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
- Single quotes for strings, semicolons required, 2-space indentation
- Run `npm run lint` before committing to ensure code quality

## Development Workflow

1. Make code changes in scripts/, popup/, or options/ directories
2. Test extension by reloading at `chrome://extensions/`
3. Run `npm run lint` to check for code quality issues
4. Run `npm run test` to verify functionality
5. Fix any linting or test errors before committing
6. Commit changes with descriptive messages

## Linting

The project uses ESLint with the following configuration:
- **Environment:** Browser + WebExtensions (Manifest V3)
- **Parser:** ES2022
- **Rules:** Recommended + custom rules for consistency
  - `no-unused-vars`: Error (except vars/args prefixed with `_`)
  - `no-console`: Warning (use sparingly in production code)
  - `semi`: Required semicolons
  - `quotes`: Single quotes preferred
  - `indent`: 2 spaces
  - Additional rules for code quality and consistency

**Linting Commands:**
- `npm run lint` - Check all JavaScript files in scripts/, popup/, options/
- `npx eslint <file>` - Check specific file
- `npx eslint <file> --fix` - Auto-fix issues in specific file

**ESLint ignores:** node_modules/, build outputs, test files, debug scripts (see .eslintignore)
