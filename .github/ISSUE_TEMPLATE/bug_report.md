---
name: Bug Report
about: Report a bug or unexpected behavior
title: "BUG: "
labels: bug, enhancement
assignees: "chirag127"

body:
  - type: markdown
    attributes:
      value: | # Use the new repo name in the URL.
        ### Please provide a clear and concise description of the bug.
        Thank you for helping improve **BookmarkMind-AI-Bookmark-Categorization-Browser-Extension**!

        **IMPORTANT:** Before reporting, please review the AI Agent Directives to understand the expected behavior and constraints.
        See: [AGENTS.md](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/AGENTS.md)

        To help us diagnose the issue faster, please follow the template below.

  - type: input
    id: version
    attributes:
      label: Extension Version
      description: The current version of the BookmarkMind extension you are using.
      placeholder: e.g., 1.2.0
    validations:
      required: true

  - type: input
    id: browser
    attributes:
      label: Browser & Version
      description: Which browser and version are you experiencing the issue in?
      placeholder: e.g., Chrome 125.0.6422.142
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Provide detailed steps that trigger the bug.
      placeholder: | # Use the new repo name in the URL.
        1. Go to your bookmarks manager.
        2. Click the 'Categorize Selected' button.
        3. Observe the behavior...
        4. See: [AI Agent Directives](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/AGENTS.md) for expected AI processing.
    validations:
      required: true

  - type: textarea
    id: expected_behavior
    attributes:
      label: Expected Behavior
      description: What did you expect to happen?
      placeholder: | # Use the new repo name in the URL.
        I expected the selected bookmarks to be automatically categorized based on their content and URL, following the AI model's output as described in the AGENTS.md.
    validations:
      required: true

  - type: textarea
    id: actual_behavior
    attributes:
      label: Actual Behavior
      description: What actually happened? Please include any error messages.
      placeholder: | # Use the new repo name in the URL.
        The bookmarks were not categorized, or they were categorized incorrectly. An error message appeared in the console: [Paste Error Here].
        Refer to console logs for detailed AI interaction outputs if applicable. See: [AI Agent Directives](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/AGENTS.md)
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots/Recordings (Optional)
      description: If applicable, add screenshots to help explain your problem. You can drag files here to upload them.

  - type: textarea
    id: additional_context
    attributes:
      label: Additional Context (Optional)
      description: Provide any other context about the problem. This might include relevant bookmarks, screenshots of model dashboard performance, or logs from the model performance dashboard.
      placeholder: | # Use the new repo name in the URL.
        My bookmarks are all related to AI research. When using Gemini Pro, the categories are very generic. See [Model Performance Dashboard](https://github.com/chirag127/BookmarkMind-AI-Bookmark-Categorization-Browser-Extension/blob/main/docs/model-dashboard.md) for details on current model performance.
