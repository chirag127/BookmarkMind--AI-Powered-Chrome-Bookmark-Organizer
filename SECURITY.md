# Security & Privacy

BookmarkMind is designed with security and privacy as top priorities. This document outlines our security practices and how we handle your data.

## Data Handling

### Local-First Architecture

-   **No Backend Server:** The extension runs entirely in your browser. There is no central server collecting your data.
-   **Local Storage:** All settings, learning data, and cached information are stored locally in your browser using `chrome.storage`.

### AI Processing

-   **Data Transmission:** Only the _title_ and _URL_ of your bookmarks are sent to the AI provider you select (Google, Cerebras, or Groq).
-   **No Personal Data:** We do not collect names, emails, or passwords.
-   **Ephemeral:** Data sent to the AI is for categorization only and is not used to train their models (subject to the AI provider's terms).

## API Key Security

### Storage

-   API keys are stored in `chrome.storage.sync` (encrypted by Chrome if you use sync) or `chrome.storage.local`.
-   Keys are **never** exposed to page scripts or third-party analytics.

### Best Practices

-   **Validation:** The extension validates API keys before saving to ensure they match expected formats.
-   **Transmission:** Keys are sent only to the respective API endpoints via HTTPS.

## Content Security Policy (CSP)

We adhere to Manifest V3's strict Content Security Policy:

-   **No Remote Code:** No external JavaScript is loaded or executed.
-   **Sandboxed:** The extension runs in a secure, isolated environment.

## Permissions

See [PERMISSIONS.md](PERMISSIONS.md) for a detailed breakdown of all requested permissions.

## Reporting Vulnerabilities

If you find a security issue, please open an issue on our GitHub repository or contact the maintainers directly. Do not publicly disclose vulnerabilities until they have been addressed.
