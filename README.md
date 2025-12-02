# BookmarkMind-AI-Bookmark-Categorization-Browser-Extension

<!-- BADGES START -->
[![Build Status](https://img.shields.io/github/actions/workflow/user/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/ci.yml?label=Build&style=flat-square)](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension?style=flat-square)](https://app.codecov.io/gh/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension)
[![Tech Stack](https://img.shields.io/badge/tech-stack-JavaScript%2C%20AI%2C%20Browser%20Extension-blue?style=flat-square)](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension)
[![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-orange.svg?style=flat-square)](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension?style=flat-square)](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/stargazers)
<!-- BADGES END -->

## ⭐ Star ⭐ this Repo

## The Intelligent Bookmark Organizer

BookmarkMind is a revolutionary AI-powered browser extension that leverages multiple advanced AI models (including Gemini and Groq) to automatically categorize your bookmarks. It learns your organization patterns, provides snapshot/undo capabilities, and offers a performance dashboard for model insights, ensuring optimal bookmark management.

## 🚀 Architecture Overview

This project employs a modern, modular architecture designed for maintainability and extensibility, utilizing the **Apex Toolchain** for Browser Extensions.

mermaid
graph TD
    A[Browser Extension API] --> B(Content Script)
    B --> C{Extension Background Service}
    C --> D[AI Model Orchestrator]
    D --> E1(Gemini API)
    D --> E2(Groq API)
    D --> E3(Other Models)
    C --> F[Bookmark Management Module]
    F --> G(Local Storage / Sync Storage)
    C --> H[User Interface]
    H --> B
    C --> I[Learning System]
    I --> F
    C --> J[Snapshot/Undo Manager]
    J --> G
    C --> K[Model Performance Dashboard]
    K --> D


## 📚 Table of Contents

- [🚀 Architecture Overview](#-architecture-overview)
- [📚 Table of Contents](#-table-of-contents)
- [💡 Key Features](#-key-features)
- [🛠️ Technology Stack](#-technology-stack)
- [🔧 Development Setup](#-development-setup)
- [📜 License](#license)
- [🤝 Contributing](#contributing)
- [🛡️ Security](#security)
- [🤖 AI Agent Directives](#-ai-agent-directives)

## 💡 Key Features

-   **AI-Powered Categorization:** Automatically assigns relevant categories to new and existing bookmarks using state-of-the-art LLMs.
-   **Multi-Model Support:** Integrates with leading AI providers like Google Gemini and Groq, with extensibility for more.
-   **Intelligent Learning System:** Adapts categorization based on user feedback and established patterns.
-   **Snapshot & Undo:** Create snapshots of your bookmark states and revert to previous versions with ease.
-   **Model Performance Dashboard:** Visualize and compare the performance and accuracy of different AI models.
-   **Seamless Integration:** Runs directly in your browser, enhancing productivity without disruption.

## 🛠️ Technology Stack

This project adheres to the **Apex Tech Stack** for Browser Extensions (Late 2025 Standards):

*   **Language:** TypeScript 6.x (Strict Mode)
*   **Bundler:** Vite 7 (Rolldown Engine)
*   **Extension Framework:** WXT (Web Extension Test harness)
*   **UI Framework:** (Optional, e.g., Preact/React or Web Components)
*   **Styling:** TailwindCSS v4
*   **AI Integration:** Gemini API, Groq API
*   **State Management:** Signals
*   **Testing:** Vitest (Unit), Playwright (E2E)
*   **Linting/Formatting:** Biome

## 🔧 Development Setup

Follow these steps to set up the development environment:

1.  **Clone the repository:**
    bash
      git clone https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension.git
      cd BookmarkMind-AI-Bookmark-Categorization-Browser-Extension
    

2.  **Install Dependencies:**
    bash
      npm install
    

3.  **Run Development Server:**
    bash
      npm run dev
    
    (This will typically build the extension in watch mode and provide instructions for loading it into your browser.)

### Scripts

| Script      | Description                                              |
| :---------- | :------------------------------------------------------- |
| `dev`       | Start development server, auto-rebuild on changes.       |
| `build`     | Build production-ready extension assets.                 |
| `lint`      | Run Biome linter and formatter.                          |
| `test`      | Run Vitest unit and integration tests.                   |
| `test:e2e`  | Run Playwright end-to-end tests.                         |

## 📜 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**. See the `LICENSE` file for more details.

## 🤝 Contributing

Contributions are welcome! Please refer to `.github/CONTRIBUTING.md` for guidelines on how to submit bug reports, feature requests, and pull requests.

## 🛡️ Security

Security is paramount. Please review our security guidelines in `.github/SECURITY.md` and report any vulnerabilities responsibly.

---

<details>
  <summary>🤖 AI AGENT DIRECTIVES</summary>

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
  **Directives:** Detect the project type and apply the corresponding **Apex Toolchain**. This repository, `BookmarkMind-AI-Bookmark-Categorization-Browser-Extension`, is a JavaScript/TypeScript Browser Extension.

  *   **PRIMARY SCENARIO A: WEB / APP / EXTENSION (TypeScript) - *Applicable for this project.***
      *   **Stack:** TypeScript 6.x (Strict), Vite 7 (Rolldown), Tauri v2.x (Native - *if applicable*), WXT (Web Extension Test harness).
      *   **State:** Signals (Standardized).
      *   **Lint/Format:** Biome (Speed and Consistency).
      *   **Testing:** Vitest (Unit Testing), Playwright (End-to-End Testing).
      *   **Architecture:** Adheres to Feature-Sliced Design (FSD) principles within the extension context, promoting modularity and clear boundaries.
      *   **UI:** TailwindCSS v4 for rapid and consistent styling.

  *   **SECONDARY SCENARIO: DATA / SCRIPTS / AI (Python) - *Not applicable for this project's core function.***
      *   **Stack:** Python 3.10+ with **uv** (package management), **Ruff** (linting/formatting), **Pytest** (testing).
      *   **Architecture:** Modular Monolith or Microservices.
      *   **AI Integration:** Google Gemini API, etc.
      *   **CLI Framework:** `Click` or similar.

  ---

  ## 4. APEX NAMING CONVENTION (THE "STAR VELOCITY" ENGINE)
  A high-performing name must instantly communicate **Product**, **Function**, **Platform**, and **Type**.

  **Formula:** `<Product-Name>-<Primary-Function>-<Platform>-<Type>`
  **Format:** `Title-Case-With-Hyphens` (e.g., `BookmarkMind-AI-Bookmark-Categorization-Browser-Extension`).

  **Rules:**
  1.  **Length:** 3 to 10 words.
  2.  **Keywords:** MUST include high-volume terms.
  3.  **Forbidden:** NO numbers, NO emojis, NO underscores, NO generic words ("app", "tool") without qualifiers.

  ---

  ## 5. CHAIN OF THOUGHT (CoT) PROTOCOL
  Before generating JSON, perform deep analysis in `<thinking>` block:
  1.  **Audit:** Analyze repo content and purpose.
  2.  **Pivot/Archive Decision:** Is it junk? If so, rename to `Archived-...`. If not, PIVOT to elite status.
  3.  **Naming Strategy:** Apply `<Product>-<Function>-<Type>` formula.
  4.  **Replication Protocol:** Draft the "AI Agent Directives" block.
  5.  **File Generation:** Plan the content for all 11 required files (including `PROPOSED_README.md` and `badges.yml`).
  6.  **Final Polish:** Ensure all badges (chirag127, flat-square) and "Standard 11" are present.
  7.  **Strict Adherence:** Ensure `PROPOSED_README.md` strictly follows the `AGENTS.md` directives.

  ---

  ## 6. DYNAMIC URL & BADGE PROTOCOL
  **Mandate:** All generated files MUST use the correct dynamic URLs based on the **New Repository Name**.

  **Rules:**
  1.  **Base URL:** `https://github.com/chirag127/<New-Repo-Name>`
  2.  **Badge URLs:** All badges (Shields.io) must point to this Base URL or its specific workflows (e.g., `/actions/workflows/ci.yml`).
  3.  **Consistency:** Never use the old/original repository name in links. Always use the new "Apex" name.
  4.  **AGENTS.md Customization:** The generated `AGENTS.md` **MUST** be customized for the specific repository's technology stack (e.g., if Rust, use Rust tools; if JavaScript/TypeScript Extension, use appropriate tools), while retaining the core Apex principles. Do not just copy the generic template; adapt it.

  ---

  ## 7. DOCUMENTATION & ARCHIVAL (THE "RETIRED PRODUCT" STANDARD)
  *   **README.md:** The primary interface. Must be comprehensive, well-structured, and visually appealing. Includes AI Agent Directives.
  *   **AGENTS.md:** Defines the operational parameters and technology stack for AI agents interacting with the repository. **MUST BE CUSTOMIZED PER REPOSITORY TYPE.**
  *   **LICENSE:** Specifies usage rights (CC BY-NC 4.0 mandated).
  *   **` .gitignore`:** Ensures clean commits.
  *   **`.github/workflows/ci.yml`:** Robust CI/CD pipeline.
  *   **`.github/CONTRIBUTING.md`:** Guidelines for external contributions.
  *   **`.github/ISSUE_TEMPLATE/*`:** Standardized issue reporting.
  *   **`.github/PULL_REQUEST_TEMPLATE.md`:** Standardized PR process.
  *   **`.github/SECURITY.md`:** Security policies and reporting.
  *   **Retired Products:** Archived repositories are "Retired Products" and must maintain professional, descriptive metadata (Name, Description, Topics, README) just like active projects.

  ---

  ## 8. OPERATIONAL MANDATES
  *   **Version Control:** Git is the sole VCS.
  *   **Branching:** `main` for stable, `develop` for integration. Feature branches from `develop`.
  *   **Commit Messages:** Conventional Commits standard (`feat:`, `fix:`, `chore:`, etc.).
  *   **Code Quality:** Enforce strict linting (Biome) and type checking (TypeScript Strict Mode).
  *   **Testing:** Comprehensive unit (Vitest) and E2E (Playwright) tests are mandatory. Minimum 85% code coverage.
  *   **Dependency Management:** `npm` or `yarn` with lock files. Vite for bundling.
  *   **API Keys & Secrets:** **NEVER** hardcode. Use environment variables or a secure secret management system. Integrate with browser's secret storage mechanisms where appropriate.

  ---

  ## 9. DEVELOPMENT WORKFLOW INTEGRATION
  *   **Local Development:** Utilize Vite's dev server (`npm run dev`) for hot-reloading.
  *   **Browser Loading:** Instructions for loading unpacked extensions in Chrome/Firefox/Edge.
  *   **Debugging:** Leverage browser developer tools and IDE debuggers.

  ---

  ## 10. AI INTERACTION PROTOCOL
  *   **Code Generation:** Generate idiomatic, efficient, and well-documented code following the specified tech stack.
  *   **Refactoring:** Improve code quality, performance, and maintainability.
  *   **Testing:** Write comprehensive tests that cover edge cases and standard scenarios.
  *   **Documentation:** Maintain up-to-date documentation, especially the `README.md` and `AGENTS.md`.
  *   **Security Audits:** Proactively identify and mitigate potential security vulnerabilities.

  ---

  ## 11. COMPLIANCE & STANDARDS
  *   **Standard 11:** Ensure all 11 mandated files (`README.md`, `PROPOSED_README.md`, `badges.yml`, `LICENSE`, `.gitignore`, `ci.yml`, `CONTRIBUTING.md`, `ISSUE_TEMPLATE/*`, `PULL_REQUEST_TEMPLATE.md`, `SECURITY.md`, `AGENTS.md`) are present and correctly configured.
  *   **Ethical AI Use:** Ensure AI integrations are used responsibly and ethically, respecting user privacy and data.

</details>
