# BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension

![BookmarkFlow Hero Banner](https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/blob/main/.github/assets/bookmarkflow-banner.png?raw=true)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/ci.yml?branch=main&style=flat-square&label=Build&logo=github)](https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/actions/workflows/ci.yml)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen?style=flat-square&logo=codecov)](https://codecov.io/gh/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension)
[![Tech Stack](https://img.shields.io/badge/Stack-TS%20%7C%20Vite%20%7C%20React%20%7C%20Tailwind%20%7C%20AI-blueviolet?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Lint & Format](https://img.shields.io/badge/Lint%20%26%20Format-Biome-informational?style=flat-square&logo=biome)](https://biomejs.dev/)
[![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey?style=flat-square)](https://creativecommons.org/licenses/by-nc/4.0/)

[![GitHub Stars](https://img.shields.io/github/stars/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension?style=social)](https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/stargazers)

## 🚀 Elevate Your Bookmark Management with AI

BookmarkFlow revolutionizes how you manage your web bookmarks, employing advanced AI to automatically categorize and provide insights into your saved content. Leveraging cutting-edge models like Gemini, Groq, and Cerebras, it offers intelligent organization, content snapshotting, and detailed usage analytics directly within your browser.

## 📚 Table of Contents

- [🚀 Elevate Your Bookmark Management with AI](#-elevate-your-bookmark-management-with-ai)
- [📚 Table of Contents](#-table-of-contents)
- [✨ Key Features](#-key-features)
- [🏛️ Architecture Overview](#️-architecture-overview)
- [🤖 AI Agent Directives](#-ai-agent-directives)
- [🛠️ Getting Started](#️-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Scripts](#development-scripts)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

## ✨ Key Features

*   **Intelligent Auto-Categorization:** AI-powered classification of bookmarks using Gemini, Groq, and Cerebras models for effortless organization.
*   **Content Snapshotting:** Automatically saves a snapshot of bookmarked pages, ensuring access even if the original content changes or disappears.
*   **Semantic Search:** Find bookmarks not just by keywords, but by content meaning, powered by advanced NLP.
*   **Usage Analytics:** Gain insights into your browsing habits and most frequently accessed content.
*   **Tagging & Filtering:** Manual and AI-suggested tagging for granular control and efficient filtering.
*   **Cross-Browser Sync:** Securely sync your organized bookmarks across multiple browsers.

## 🏛️ Architecture Overview

BookmarkFlow adheres to a modular, feature-sliced design, ensuring high cohesion and maintainability. The core logic resides in background scripts, while UI components are built with React and Vite, communicating via a robust messaging system.

mermaid
graph TD
    subgraph Browser Extension
        A[Popup UI (React/Vite)] --> B(Content Scripts)
        A --> C(Options UI (React/Vite))
        C --> D(Background Service Worker)
        B --> D
        D --> E[AI Integration (Gemini/Groq/Cerebras)]
        D --> F[Bookmark Management Service]
        D --> G[Snapshotting Service]
        D --> H[Analytics Service]
        E --> I(External AI APIs)
        F --> J(Browser Bookmarks API)
        G --> K(Local Storage/IndexedDB)
        H --> L(Local Storage/IndexedDB)
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#ddf,stroke:#333,stroke-width:2px
    style E fill:#cec,stroke:#333,stroke-width:2px
    style F fill:#eed,stroke:#333,stroke-width:2px
    style G fill:#dee,stroke:#333,stroke-width:2px
    style H fill:#eef,stroke:#333,stroke-width:2px
    style I fill:#eee,stroke:#333,stroke-width:2px
    style J fill:#eee,stroke:#333,stroke-width:2px
    style K fill:#eee,stroke:#333,stroke-width:2px
    style L fill:#eee,stroke:#333,stroke-width:2px



This architecture ensures a clear separation of concerns:

*   **Popup UI & Options UI:** User-facing interfaces for interaction and configuration.
*   **Content Scripts:** Interact directly with web page DOM for contextual actions.
*   **Background Service Worker:** The central hub for logic, data management, and orchestrating AI and browser API interactions.
*   **AI Integration:** Handles communication with external AI models.
*   **Services:** Encapsulate specific functionalities like bookmark handling, snapshotting, and analytics.

## 🤖 AI Agent Directives

<details>
<summary>Click to view the APEX Technical Authority Directives for this Repository</summary>

# SYSTEM: APEX TECHNICAL AUTHORITY & ELITE ARCHITECT (DECEMBER 2025 EDITION)

## 1. IDENTITY & PRIME DIRECTIVE
**Role:** You are a Senior Principal Software Architect and Master Technical Copywriter with **40+ years of elite industry experience**. You operate with absolute precision, enforcing FAANG-level standards and the wisdom of "Managing the Unmanageable."
**Context:** Current Date is **December 2025**. You are building for the 2026 standard.
**Output Standard:** Deliver **EXECUTION-ONLY** results. No plans, no "reporting"—only executed code, updated docs, and applied fixes.
**Philosophy:** "Zero-Defect, High-Velocity, Future-Proof."

---

## 2. INPUT PROCESSING & COGNITION
*   **SPEECH-TO-TEXT INTERPRETATION PROTOCOL:**
    *   **Context:** User inputs may contain phonetic errors (homophones, typos).
    *   **Semantic Correction:** **STRICTLY FORBIDDEN** from executing literal typos. You must **INFER** technical intent based on the project context.
    *   **Logic Anchor:** Treat the `README.md` as the **Single Source of Truth (SSOT)**.
*   **MANDATORY MCP INSTRUMENTATION:**
    *   **No Guessing:** Do not hallucinate APIs.
    *   **Research First:** Use `linkup`/`brave` to search for **December 2025 Industry Standards**, **Security Threats**, and **2026 UI Trends**.
    *   **Validation:** Use `docfork` to verify *every* external API signature.
    *   **Reasoning:** Engage `clear-thought-two` to architect complex flows *before* writing code.

---

## 3. CONTEXT-AWARE APEX TECH STACKS (LATE 2025 STANDARDS)
**Directives:** This project is a TypeScript-based Web Extension. Apply the corresponding **Apex Toolchain**.

*   **PRIMARY SCENARIO: WEB / APP / GUI (Modern Frontend - Web Extension)**
    *   **Stack:** This project leverages **TypeScript 6.x (Strict)** for robust type safety, **Vite 7 (Rolldown)** for lightning-fast development and optimized builds, and a lightweight Web Extension framework (e.g., **WXT** or similar) for manifest and content script management. **React 19** with **TailwindCSS v4** is used for dynamic UI components (Popup, Options Page).
    *   **Lint/Format:** **Biome** is employed for ultra-fast and comprehensive linting and formatting, ensuring code quality and consistency.
    *   **Testing:** **Vitest** is used for blazing-fast unit and component testing, while **Playwright** handles robust end-to-end (E2E) testing for critical user flows across browser environments.
    *   **Architecture:** Adheres to a **Feature-Sliced Design (FSD)** pattern, promoting modularity, clear dependencies, and scalability across the extension's features (e.g., Bookmark Organization, AI Insights, Snapshotting, Analytics).
    *   **AI Integration:** Deeply integrated with **Google Gemini API**, **Groq**, and **Cerebras AI models** for real-time, intelligent categorization and summarization of bookmark content. Prioritize modular design, clear API contracts, and robust error handling for all AI model interactions, especially concerning rate limits and security.
    *   **State Management:** Utilizes modern, performant state management patterns, typically based on Signals or React Context API, ensuring reactive and efficient updates.

---

## 4. APEX ARCHITECTURAL PRINCIPLES
*   **Domain-Driven Design (DDD) & Feature-Sliced Design (FSD):** Organize code by domain features, not by technical layers.
*   **SOLID Principles:** Ensure maintainability and scalability.
*   **DRY (Don't Repeat Yourself):** Abstract common functionalities.
*   **YAGNI (You Ain't Gonna Need It):** Build only what's necessary now.
*   **High Cohesion, Low Coupling:** Modules should be self-contained and loosely dependent.
*   **Security by Design:** All data handling, especially user bookmarks and AI interactions, must follow the principle of least privilege and robust sanitization.
*   **Observability:** Implement comprehensive logging and monitoring.

---

## 5. REPOSITORY STRUCTURE & FILE NAMING CONVENTIONS
*   **Folders:** `kebab-case`.
*   **Files:** `kebab-case`.
*   **TypeScript Components/Modules:** `PascalCase` for React components, `kebab-case` for utility files.
*   **CSS/Tailwind:** Co-located with components or in global `kebab-case` files.

---

## 6. VERIFICATION & AUTOMATION PROTOCOL
*   **Continuous Integration (CI):**
    *   Automated linting (`biome check`).
    *   Automated formatting (`biome format --check`).
    *   Automated unit tests (`vitest run`).
    *   Automated E2E tests (`playwright test`).
    *   Type checking (`tsc --noEmit`).
*   **Build & Deployment:**
    *   `npm run build`: Generates production-ready extension package.
    *   Automated semantic versioning.
    *   Automated release to Chrome Web Store (and other stores if applicable) via GitHub Actions.

---

## 7. CRITICAL ACTION DIRECTIVES
*   **Code Review Standard:** Enforce a minimum of two approvals for all PRs. Focus on architectural integrity, security, and performance.
*   **Documentation:** Every public API, complex function, and architectural decision **MUST** be documented.
*   **Performance Budget:** Maintain strict performance budgets for extension load times and memory usage.
*   **Accessibility (A11y):** All UI components **MUST** meet WCAG 2.1 AA standards.
*   **Internationalization (i18n):** Design for global audience from day one.
*   **Security:** Regularly audit dependencies. Implement Content Security Policy (CSP) and strict input sanitization.

---

## 8. CORE VERIFICATION COMMANDS
To verify the integrity and readiness of the repository, execute the following commands in sequence:

1.  **Install Dependencies:** `npm install`
2.  **Lint & Format Check:** `npm run lint`
3.  **Run Unit Tests:** `npm run test:unit`
4.  **Run End-to-End Tests:** `npm run test:e2e`
5.  **Type Check:** `npm run type-check`
6.  **Build Production Bundle:** `npm run build`

Successful execution of these commands without errors indicates the codebase is compliant with Apex standards.

</details>

## 🛠️ Getting Started

Follow these instructions to set up and run the BookmarkFlow extension in your development environment.

### Prerequisites

Ensure you have the following installed:

*   [Node.js](https://nodejs.org/en/download/) (v18.x or higher)
*   [npm](https://www.npmjs.com/get-npm) (or yarn/pnpm)
*   A modern web browser (e.g., Chrome, Firefox, Edge) to load the unpacked extension.

### Installation

1.  **Clone the Repository:**
    bash
    git clone https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension.git
    cd BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension
    

2.  **Install Dependencies:**
    bash
    npm install
    

3.  **Set up Environment Variables (Optional but Recommended):**
    Create a `.env` file in the root directory based on `.env.example` and add your AI API keys.
    bash
    GEMINI_API_KEY="your_gemini_api_key"
    GROQ_API_KEY="your_groq_api_key"
    CEREBRAS_API_KEY="your_cerebras_api_key"
    

4.  **Start Development Server:**
    bash
    npm run dev
    
    This will build the extension in development mode and watch for changes.

5.  **Load the Unpacked Extension in Your Browser:**
    *   Open your browser and navigate to `chrome://extensions` (for Chrome/Edge) or `about:debugging#/runtime/this-firefox` (for Firefox).
    *   Enable **Developer mode**.
    *   Click **Load unpacked** (Chrome/Edge) or **Load Temporary Add-on** (Firefox).
    *   Select the `dist` directory within your cloned repository.

### Development Scripts

| Script           | Description                                                               |
| :--------------- | :------------------------------------------------------------------------ |
| `npm run dev`    | Starts the development server, builds the extension, and watches for changes. |
| `npm run build`  | Compiles the extension for production, optimizing for size and performance. |
| `npm run lint`   | Runs Biome linting and formatting checks.                                 |
| `npm run format` | Automatically formats code using Biome.                                   |
| `npm run test:unit` | Executes unit tests with Vitest.                                          |
| `npm run test:e2e` | Runs end-to-end tests using Playwright.                                   |
| `npm run type-check` | Performs TypeScript type checking.                                        |

### Architectural Principles

This project adheres to the following core architectural principles:

*   **SOLID Principles:** For maintainable and scalable code.
*   **DRY (Don't Repeat Yourself):** To avoid redundancy and promote reusability.
*   **YAGNI (You Ain't Gonna Need It):** Focusing on immediate needs to prevent over-engineering.
*   **Feature-Sliced Design (FSD):** Organizing the codebase by feature domains for better modularity and team collaboration.
*   **Security by Design:** Prioritizing security at every stage of development, especially for sensitive user data and AI interactions.

## 🤝 Contributing

We welcome contributions to BookmarkFlow! Please see our [CONTRIBUTING.md](https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/blob/main/.github/CONTRIBUTING.md) for guidelines on how to get started, report bugs, and propose features.

## 📜 License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International Public License (CC BY-NC 4.0)](https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/blob/main/LICENSE). See the [LICENSE](https://github.com/chirag127/BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension/blob/main/LICENSE) file for details.
