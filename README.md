# BookmarkMind-AI-Bookmark-Categorization-Browser-Extension

![Build Status](https://img.shields.io/github/actions/workflow/user/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/ci.yml?style=flat-square)
![Code Coverage](https://img.shields.io/codecov/c/github/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18.2.0-cyan?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.2-purple?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-4.4.2-yellow?style=flat-square)
![Biome](https://img.shields.io/badge/Lint%20Format-Biome-FFD700?style=flat-square)
![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-orange?style=flat-square)
![GitHub Stars](https://img.shields.io/github/stars/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension?style=flat-square)

[⭐ Star this Repo ⭐](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension)

## BLUF
BookmarkMind is an intelligent browser extension that leverages state-of-the-art AI models to automatically categorize your bookmarks, providing unparalleled organization and retrieval capabilities. It features a sophisticated learning system, undo/snapshot functionality, and a comprehensive model performance dashboard for a superior bookmark management experience.

## Architecture
mermaid
graph TD
    A[User Interaction] --> B(Browser Extension API)
    B --> C{Content Scripts}
    C --> D(AI Orchestration Service)
    D --> E{AI Models (Gemini, Groq, etc.)}
    E --> F(Categorization Results)
    F --> D
    D --> G(Extension Background Service)
    G --> H(Local Storage / Sync Storage)
    G --> I(UI Layer - React/Tailwind)
    I --> A
    G --> J(Learning System)
    J --> D
    G --> K(Snapshot/Undo Manager)
    K --> H
    G --> L(Model Performance Dashboard)
    L --> H


## Table of Contents
- [BLUF](#bluf)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [AI Agent Directives](#ai-agent-directives)
- [Development Standards](#development-standards)
- [Contributing](#contributing)
- [License](#license)
- [Security](#security)

## Features
- **AI-Powered Auto-Categorization:** Utilizes 16+ sophisticated AI models (including Gemini, Groq) to intelligently assign categories to your bookmarks.
- **Multi-Model Support:** Dynamically integrates and selects from a wide array of LLMs for optimal performance and flexibility.
- **Learning System:** Continuously improves categorization accuracy based on user feedback and interaction.
- **Snapshot & Undo:** Maintain backups of your bookmark organization and revert to previous states with ease.
- **Model Performance Dashboard:** Visualize and compare the performance of different AI models for your categorization tasks.
- **Seamless Integration:** Works directly within your browser, offering a fluid and intuitive user experience.

## Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn
*   An API key for your preferred AI models (e.g., Google Gemini, Groq Cloud)

### Installation
1.  **Clone the repository:**
    bash
    git clone https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension.git
    cd BookmarkMind-AI-Bookmark-Categorization-Browser-Extension
    

2.  **Install dependencies:**
    bash
    npm install
    # or
    yarn install
    

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your API keys:
    env
    VITE_GEMINI_API_KEY=your_gemini_api_key
    VITE_GROQ_API_KEY=your_groq_api_key
    # Add other model API keys as needed
    

4.  **Run the development server:**
    bash
    npm run dev
    # or
    yarn dev
    

5.  **Load as Unpacked Extension:**
    Follow your browser's instructions to load the `dist` folder as an unpacked extension.

## Usage
Once installed, the BookmarkMind extension will automatically begin analyzing and categorizing your bookmarks. Access its features and settings through the extension's popup interface.

## AI Agent Directives
<details>
<summary>Click to expand AI Agent Directives</summary>

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
**Directives:** Detect the project type (`package.json` for Web Extensions) and apply the corresponding **Apex Toolchain**.

*   **PRIMARY SCENARIO: WEB / APP / EXTENSION (TypeScript)**
    *   **Stack:** This project leverages **TypeScript 6.x (Strict)**, **Vite 7 (Rolldown)** as the build tool, and **WXT** (Web Extension Tooling) for streamlined browser extension development. UI components are built with **React 19+**, styled using **Tailwind CSS v4+**. For testing, **Vitest** is used for unit/integration tests, and **Playwright** for end-to-end testing.
    *   **State Management:** Employing standardized Signals for reactive state management across the application.
    *   **Architecture:** Adheres to a **Feature-Sliced Design (FSD)** pattern for maintainable and scalable frontend architecture, ensuring clear separation of concerns.
    *   **Linting/Formatting:** Utilizes **Biome** for ultra-fast linting and code formatting, ensuring code quality and consistency.

*   **SECONDARY SCENARIO B: SYSTEMS / PERFORMANCE (Rust/Go) - *Not applicable for this project.***
    *   **Stack:** Rust (Cargo) or Go (Modules).
    *   **Lint:** Clippy / GolangCI-Lint.
    *   **Architecture:** Hexagonal Architecture (Ports & Adapters).

*   **TERTIARY SCENARIO C: DATA / AI / SCRIPTS (Python) - *Not applicable for this project.***
    *   **Stack:** uv (Manager), Ruff (Linter), Pytest (Test).
    *   **Architecture:** Modular Monolith or Microservices.

---

## 4. DEVELOPMENT WORKFLOW & VERIFICATION PROTOCOLS
*   **SETUP & BUILD:**
    *   **Dependencies:** `npm install` / `yarn install`.
    *   **Development Server:** `npm run dev` / `yarn dev`.
    *   **Production Build:** `npm run build` / `yarn build`.
    *   **Extension Loading:** Load the `dist` directory as an unpacked extension in your browser.
*   **TESTING SUITE:**
    *   **Unit/Integration Tests:** Execute `npm run test:unit` / `yarn test:unit` (powered by Vitest).
    *   **End-to-End Tests:** Execute `npm run test:e2e` / `yarn test:e2e` (powered by Playwright).
*   **LINTING & FORMATTING:**
    *   **Check Code Quality:** `npm run lint` / `yarn lint`.
    *   **Format Code:** `npm run format` / `yarn format` (powered by Biome).
*   **AI MODEL INTERACTION PROTOCOL:**
    *   **Abstraction:** All AI model interactions MUST be abstracted behind service layers (e.g., `GeminiService`, `GroqService`).
    *   **API Keys:** Securely manage API keys via environment variables (`.env` file, VITE_* prefix for Vite compatibility). **NEVER** commit keys directly.
    *   **Rate Limiting & Retries:** Implement robust error handling, including rate limiting awareness and exponential backoff retry strategies for AI API calls.
    *   **Model Selection:** The orchestration layer must intelligently select the best model based on task requirements, cost, and performance metrics.
    *   **Response Validation:** Validate AI model responses against expected schemas to prevent downstream errors.

---

## 5. PRINCIPLES OF OPERATION
*   **SOLID:** Adhere to Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.
*   **DRY (Don't Repeat Yourself):** Minimize code duplication through abstraction and reusable components.
*   **YAGNI (You Ain't Gonna Need It):** Implement only necessary features; avoid premature optimization or over-engineering.
*   **Accessibility (A11y):** Ensure the extension's UI is accessible to all users, following WCAG guidelines.
*   **Performance:** Optimize for speed and resource efficiency, especially crucial for browser extensions.

---

## 6. DOCUMENTATION & ARCHIVAL
*   **README as SSOT:** The `README.md` is the primary source of truth for project operation.
*   **Code Comments:** Use clear, concise JSDoc/TSDoc comments for functions, classes, and complex logic.
*   **AI Agent Directives:** This section **MUST** be updated to reflect the current tech stack and operational guidelines for any AI agents interacting with this codebase.
*   **Archival Protocol:** Even retired repositories must maintain professional documentation.

</details>

## Development Standards

### Core Principles
- **SOLID:** Adherence to object-oriented design principles for maintainable and extensible code.
- **DRY:** Minimize code duplication.
- **YAGNI:** Implement only what is needed now.

### Testing Strategy
- **Unit/Integration Tests:** Executed via `Vitest` (`npm run test:unit`).
- **End-to-End Tests:** Executed via `Playwright` (`npm run test:e2e`).

### Linting & Formatting
- **Biome:** Ensures code quality and consistency across the project (`npm run lint`, `npm run format`).

### AI Integration
- All AI model interactions are abstracted and managed through dedicated services.
- API keys are handled securely via environment variables (`.env`).
- Robust error handling, rate limiting, and retry mechanisms are implemented for all external API calls.

## Contributing
We welcome contributions! Please read our [CONTRIBUTING.md](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/.github/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License
This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.
See the [LICENSE](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/LICENSE) file for more details.

## Security
For security-related issues, please refer to our [SECURITY.md](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/.github/SECURITY.md) guidelines.
