# Security Policy for BookmarkMind-AI-Bookmark-Categorization-Browser-Extension

As an Apex Project, we take security with the utmost seriousness. This document outlines how to report security vulnerabilities found in `BookmarkMind-AI-Bookmark-Categorization-Browser-Extension` and our commitment to rapid remediation.

## 1. Vulnerability Reporting Policy

We adhere to a strict, professional disclosure process designed to protect both users and the integrity of the codebase. If you discover a security vulnerability, **DO NOT** file a public issue or pull request.

### 1.1 Reporting Procedure

1.  **Private Disclosure:** Please email the security team directly at: `security+chirag127@apex-architect.dev`. (Note: This is a placeholder; please replace with your actual security contact email.)
2.  **Minimal Information:** In your initial email, provide only enough detail to confirm the issue. Do not include Proof-of-Concept (PoC) code unless explicitly requested or necessary for initial validation.
3.  **Acknowledgment:** We commit to acknowledging receipt of your report within **48 hours**.
4.  **Coordinated Disclosure:** We will work with you under a coordinated disclosure timeline to patch and release a fix before details are made public. The standard timeline aims for resolution within **14 days** of validated report, though critical severity issues may require faster action.

## 2. Supported Versions

We actively support and maintain security patches for the **current major version** of the extension and the preceding major version.

*   **Current Version:** `v1.x.x` (All active development branches and releases).
*   **End-of-Life (EOL):** Older, unsupported versions will not receive security updates.

## 3. Remediation and Escalation

Upon receiving a validated vulnerability report, the following automated and manual steps are triggered, mandated by the **Apex Technical Authority** directives:

1.  **CI/CD Trigger:** The report automatically triggers a high-priority run of the `.github/workflows/ci.yml` pipeline to isolate the potential impact.
2.  **Dependency Audit:** Automated scanning using standard industry tools (e.g., Snyk integration in CI, or dependency-check) is performed against all dependencies, specifically targeting the Node.js runtime and browser extension manifest requirements.
3.  **Architecture Review:** The issue is cross-referenced against known threats relevant to **Browser Extensions** and **LLM/API Integration** security (e.g., prompt injection risks against Gemini/Groq inputs).
4.  **Patch Release:** A patch is developed, rigorously tested via Vitest/Playwright (as defined in the Apex Toolchain), and deployed immediately.

## 4. Specific Security Considerations for this Project

This project utilizes external LLM APIs (Gemini, Groq). Security disclosures related to these integrations should pay special attention to:

*   **API Key Management:** Ensuring all keys are handled only in secure environments (e.g., GitHub Secrets) and never committed to source control.
*   **Input Sanitization:** Robust measures against prompt injection attacks directed at the models consuming user input.
*   **Cross-Origin Resource Sharing (CORS):** Proper configuration within the extension manifest to restrict unauthorized access.

--- 

*Last Reviewed: December 2025*
*Repository URL for reference: `https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension`*