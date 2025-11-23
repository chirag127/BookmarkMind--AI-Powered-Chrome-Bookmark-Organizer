# Extension Permissions Guide

This document explains the permissions requested by BookmarkMind and why they are necessary for the extension's functionality.

## Core Permissions

### `bookmarks`

**Why needed:** This is the core function of the extension. It allows BookmarkMind to:

-   Read your existing bookmarks to categorize them
-   Create new folders for organization
-   Move bookmarks into the correct folders

### `storage`

**Why needed:** Used to save your extension settings locally, including:

-   API keys (stored securely in sync storage)
-   User preferences (theme, batch size, etc.)
-   Learning data (user corrections)

### `tabs` & `activeTab`

**Why needed:**

-   Allows the extension to see your open tabs
-   Used to cross-reference open pages with bookmarks to get the most current title

## Host Permissions

### `<all_urls>`

**Why needed:** This permission allows the extension to fetch the **live title** of any bookmarked page.

**How it works:**

1. When you run "Organize", the extension checks each bookmark's URL.
2. It fetches the HTML of that page in the background.
3. It extracts _only_ the `<title>` tag (e.g., "GitHub - Project X" instead of just "Home").
4. This updated title is sent to the AI for much more accurate categorization.

**Privacy Note:**

-   The extension **never** sends your browsing history to any server.
-   The fetch happens locally on your machine.
-   Only the _title_ of the page is used for categorization.
-   No other data from the page is accessed or stored.

### AI Provider Domains

-   `https://generativelanguage.googleapis.com/*` (Google Gemini)
-   `https://api.cerebras.ai/*` (Cerebras)
-   `https://api.groq.com/*` (Groq)

**Why needed:** To send the bookmark data (title and URL) to the selected AI model for categorization.
