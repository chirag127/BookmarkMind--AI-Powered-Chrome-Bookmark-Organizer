# BookmarkMind Advanced Settings

This document describes all the advanced settings available in the BookmarkMind extension.

## Processing Settings

### Batch Size

-   **Options**: 10, 25, 50 (default), 75, 100, 150 bookmarks
-   **Description**: Number of bookmarks to process at once. Lower values are safer for large collections but slower. Higher values process faster but may hit API rate limits.

### Maximum Category Depth

-   **Range**: 1-4 levels (default: 2)
-   **Description**: Controls how deep category hierarchies can be. Lower values create broader, simpler categories.

### Minimum Bookmarks per Folder

-   **Range**: 2-10 bookmarks (default: 3)
-   **Description**: Folders with fewer bookmarks than this threshold will be consolidated during cleanup.

## Folder Management

### Clean up empty folders after organizing

-   **Default**: Disabled
-   **Description**: Automatically remove empty bookmark folders after categorization.

### Preserve existing folder structure

-   **Default**: Enabled
-   **Description**: Keep your manually created folders intact and only organize uncategorized bookmarks.

### Merge similar folders automatically

-   **Default**: Disabled
-   **Description**: Automatically merge folders with similar names (e.g., "Work" and "Work Projects").

## AI Behavior

### AI Confidence Threshold

-   **Range**: 50-95% (default: 70%)
-   **Description**: Minimum confidence level required for AI to categorize a bookmark. Higher values mean more bookmarks may remain uncategorized but with higher accuracy.

### Preferred AI Provider

-   **Options**: Auto (default), Google Gemini, Cerebras, Groq
-   **Description**: Choose which AI provider to use first. Auto mode tries providers in order of availability.

### Enable fallback AI providers

-   **Default**: Enabled
-   **Description**: Automatically try alternative AI providers if the primary one fails.

## Learning & Adaptation

### Enable learning from corrections

-   **Default**: Enabled
-   **Description**: Learn from your manual bookmark corrections to improve future categorizations.

### Learning Pattern Weight

-   **Range**: 0-100% (default: 50%)
-   **Description**: How much weight to give learned patterns vs AI suggestions. Higher values prioritize your corrections over AI.

## Performance & Optimization

### Retry Attempts on Failure

-   **Options**: 0, 1, 2 (default), 3, 5 retries
-   **Description**: Number of times to retry failed API requests before giving up.

### API Request Timeout

-   **Options**: 10, 20, 30 (default), 45, 60 seconds
-   **Description**: Maximum time to wait for AI provider response before timing out.

### Enable categorization caching

-   **Default**: Enabled
-   **Description**: Cache AI categorization results to avoid re-processing identical bookmarks.

### Cache Expiration

-   **Options**: 1 day, 7 days, 30 days (default), 90 days, Never expire
-   **Description**: How long to keep cached categorization results before refreshing.

## Snapshot & Backup

### Auto-create snapshots before organizing

-   **Default**: Enabled
-   **Description**: Automatically create a backup snapshot before each categorization operation.

### Maximum Snapshots to Keep

-   **Options**: 3, 5 (default), 10, 20, Unlimited
-   **Description**: Maximum number of snapshots to store. Oldest snapshots are deleted automatically.

## UI & Notifications

### Show progress notifications

-   **Default**: Enabled
-   **Description**: Display browser notifications during categorization progress.

### Enable detailed console logging

-   **Default**: Disabled
-   **Description**: Show detailed debug information in browser console (for troubleshooting).

### Interface Theme

-   **Options**: Auto (default), Light, Dark
-   **Description**: Choose the color theme for the extension interface.

## Category Generation

### Minimum Categories

-   **Range**: 5-30 (default: 15)
-   **Description**: Minimum number of categories to generate when organizing bookmarks.

### Maximum Categories

-   **Range**: 20-100 (default: 50)
-   **Description**: Maximum number of categories to generate. More categories provide finer organization.

### Enable hierarchical categorization

-   **Default**: Enabled
-   **Description**: Create nested folder structures (e.g., Work > Projects > Current) instead of flat categories.

## How to Access Advanced Settings

1. Click the BookmarkMind extension icon
2. Click "Settings" or right-click the extension icon and select "Options"
3. Scroll down to the "Advanced Settings" section
4. Adjust settings as needed
5. Click "Save Advanced Settings" to apply changes
6. Use "Reset to Defaults" to restore default values

## Tips for Optimal Configuration

### For Large Bookmark Collections (1000+ bookmarks)

-   Set Batch Size to 25-50
-   Enable caching
-   Set AI Confidence Threshold to 75-80%
-   Enable auto-snapshots

### For Fast Processing

-   Set Batch Size to 100-150
-   Use Groq as preferred AI provider
-   Reduce retry attempts to 1
-   Set request timeout to 20 seconds

### For Maximum Accuracy

-   Set AI Confidence Threshold to 85-95%
-   Enable learning from corrections
-   Set Learning Pattern Weight to 70-80%
-   Use hierarchical categorization

### For Simple Organization

-   Set Minimum Categories to 5-10
-   Set Maximum Categories to 20-30
-   Set Maximum Category Depth to 1-2
-   Disable hierarchical categorization

## Storage Considerations

-   Settings are stored in Chrome's sync storage (limited to 100KB)
-   Learning data is stored in local storage (no size limit)
-   Snapshots are stored in local storage (can grow large)
-   Consider limiting max snapshots if storage is a concern

## Performance Impact

Settings that may impact performance:

-   **High Batch Size**: Faster but may hit rate limits
-   **Low Confidence Threshold**: More bookmarks categorized but lower accuracy
-   **Caching Disabled**: Slower but always fresh results
-   **Detailed Logging**: Slight performance impact, use only for debugging

## Troubleshooting

If categorization is slow:

-   Reduce batch size
-   Enable caching
-   Increase request timeout
-   Check AI provider status

If categorization is inaccurate:

-   Increase AI confidence threshold
-   Enable learning from corrections
-   Manually correct a few bookmarks to train the system
-   Try different AI providers

If extension uses too much storage:

-   Reduce max snapshots
-   Clear old learning data
-   Disable caching or reduce cache expiration
