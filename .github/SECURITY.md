# Security Policy for BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension

As an Apex Technical Authority project, **BookmarkFlow-AI-Powered-Bookmark-Organizer-Browser-Extension** adheres to a 'Zero-Defect' security posture. We treat security as a foundational, non-negotiable requirement, integrated from the first line of code through deployment.

## Supported Versions

We only actively support the latest stable release branch of this extension. Security patches will *only* be applied to the `main` branch.

| Version | Status | Supported Until |
| :--- | :--- | :--- |
| Latest Stable (`main`) | Active Support | Ongoing |

## Reporting a Vulnerability

We take all reported security vulnerabilities with the utmost seriousness. Our triage process is managed under the strict directives outlined in our `CONTRIBUTING.md` and `ISSUE_TEMPLATE` structure.

If you discover a security vulnerability, **DO NOT** create a public issue or pull request. Please follow these steps:

1.  **Contact Directly:** Email the maintainer immediately at `security@chirag127.dev` (or use the security contact email if configured in this repository settings).
2.  **Be Detailed:** Provide a concise, step-by-step method to reproduce the vulnerability. Include environment details (e.g., Browser version, Extension state).
3.  **Confidentiality:** Do not disclose the vulnerability publicly until a patch has been developed, tested, and deployed to the `main` branch, or until 90 days have passed since initial responsible disclosure, whichever comes first.

Upon receiving a report, the Apex Team initiates the **Incident Response Protocol (IRP)**, which includes immediate assessment, replication, patching, and deployment verification via CI/CD pipelines.

## Security Auditing & Tooling

This project enforces security standards through continuous integration checks, as mandated by the **Standard 11 Compliance**: 

*   **Dependency Scanning:** Automated checks for vulnerable dependencies are performed using standard GitHub Dependabot configurations, supplemented by proactive scanning via `uv` (for Python dependencies) or `npm audit` wrappers in the CI pipeline.
*   **Static Analysis (SAST):** The TypeScript/JavaScript codebase is rigorously checked by **Biome** and built with **Strict TypeScript** settings to eliminate common pitfalls like type confusion and unsafe DOM manipulation, critical for browser extensions.
*   **AI Model Security:** Given the reliance on external AI APIs (Gemini, Groq), input sanitization and output validation layers are mandatory architectural components to prevent Prompt Injection and data leakage.

## Dependencies

This project is built upon modern, well-maintained dependencies. All third-party libraries are subject to automated review. Critical security updates will be backported immediately to the active branch.

For a detailed list of dependencies and their known vulnerabilities, please refer to the output logs of the `ci.yml` workflow runs.

---

*This policy reflects the commitment to **Future-Proof** software engineering principles.*