# Folder Insights & Organization Features

## Overview

The Folder Insights feature provides comprehensive analytics, health monitoring, and smart organization suggestions for your bookmark folders. It helps you understand and optimize your bookmark organization strategy.

## Features

### 1. Folder Statistics

Get detailed statistics for any folder:
- **Total Bookmarks**: All bookmarks including those in subfolders
- **Direct Bookmarks**: Bookmarks directly in the folder (excluding subfolders)
- **Subfolders**: Number of child folders
- **Folder Depth**: How many levels deep the folder is in the hierarchy
- **Last Modified**: When the folder or its contents were last updated
- **AI Confidence**: Average confidence score from AI categorization

### 2. Folder Health Score

Each folder receives a health score (0-100) based on:

- **Bookmark Distribution (30%)**: Ideal range is 5-30 bookmarks per folder
- **Depth Appropriateness (20%)**: Folders should not be nested more than 4 levels deep
- **Organization Quality (30%)**: Balance between bookmarks and subfolders
- **AI Confidence (20%)**: How confident the AI was when categorizing bookmarks

Health statuses:
- **Excellent** (80-100): Well-organized folder
- **Good** (60-79): Decent organization
- **Fair** (40-59): Could use improvement
- **Poor** (<40): Needs reorganization

### 3. Smart Folder Suggestions

The system provides actionable recommendations:

#### Split Suggestions
- Triggered when a folder has more than 30 bookmarks
- Analyzes bookmark similarity and suggests logical groups
- Shows potential subfolder categories

#### Consolidation Suggestions
- Triggered when a folder has fewer than 5 bookmarks but multiple subfolders
- Recommends merging related folders

#### Depth Warnings
- Alerts when folders are nested more than 4 levels deep
- Suggests flattening the structure

#### Confidence Alerts
- Flags folders with low AI confidence scores (<60%)
- Recommends manual review and recategorization

### 4. Folder Comparison

Compare up to 3 folders side-by-side:
- View all metrics in a comparison table
- Identify the best-organized folder
- See which folders need attention
- Make data-driven organization decisions

### 5. Visual Tree Map

Interactive visualization of your folder hierarchy:
- Folders sized by bookmark count
- Color-coded by health status
- Click to view detailed stats
- Quick overview of entire bookmark structure

### 6. Favorite Folders

Quick access to frequently used folders:
- Bookmark folders for instant access
- View stats at a glance
- Track folder access frequency
- See your most-accessed folders

## How to Use

### Accessing Folder Insights

1. Open the BookmarkMind extension popup
2. Click the **Folder Insights** button
3. Select a folder from the dropdown to view its statistics

### Viewing Folder Health

1. Navigate to the **Overview** tab
2. Select a folder to analyze
3. View the health score circle and breakdown metrics
4. Review smart suggestions and recommendations

### Comparing Folders

1. Go to the **Comparison** tab
2. Check the folders you want to compare (up to 3)
3. Click **Compare Selected**
4. Review the comparison table and summary

### Using the Tree Map

1. Navigate to the **Tree Map** tab
2. Select a root folder (Bookmarks Bar, Other Bookmarks, or Mobile)
3. Click **Generate Tree Map**
4. Click on any folder in the map to view its details

### Managing Favorites

1. In the **Overview** tab, click **Add to Favorites** while viewing a folder
2. Access favorites in the **Favorites** tab
3. Click a favorite to view its details
4. Remove favorites using the Remove button

## Health Score Interpretation

### Excellent (80-100)
- Ideal bookmark count (5-30)
- Appropriate folder depth (≤4 levels)
- Well-balanced organization
- High AI confidence

**Action**: Maintain current organization strategy

### Good (60-79)
- Bookmark count slightly outside ideal range
- Acceptable folder depth
- Decent organization
- Good AI confidence

**Action**: Minor tweaks recommended

### Fair (40-59)
- Too many or too few bookmarks
- Folder might be too deep
- Organization needs improvement
- Moderate AI confidence

**Action**: Review and reorganize based on suggestions

### Poor (<40)
- Significant organization issues
- Extreme bookmark counts
- Very deep nesting or poor balance
- Low AI confidence

**Action**: Immediate reorganization needed

## Smart Suggestion Actions

### Split Action
When suggested to split a folder:
1. Review the suggested subfolder categories
2. Manually create subfolders based on suggestions
3. Move bookmarks into appropriate subfolders
4. Re-run AI categorization if needed

### Consolidate Action
When suggested to consolidate:
1. Review the folder structure
2. Identify related subfolders that can merge
3. Move bookmarks to parent folder or merge subfolders
4. Clean up empty folders

### Flatten Action
When depth is too high:
1. Identify the deepest folders
2. Move bookmarks to higher-level folders
3. Reduce nesting levels
4. Maintain logical organization

### Review Action
When AI confidence is low:
1. Open the main popup
2. Use the recategorization feature
3. Manually correct miscategorized bookmarks
4. Train the AI with better examples

## Technical Details

### Metrics Calculation

#### Bookmark Distribution Score
```
Ideal: 5-30 bookmarks
Score = 100 if in ideal range
Score decreases linearly outside the range
Minimum score: 30
```

#### Depth Score
```
Ideal: ≤4 levels
Score = 100 if ≤4 levels
Score decreases by 20 per additional level
Minimum score: 20
```

#### Organization Quality Score
```
Base score: 70
+15 if has both bookmarks and subfolders
-20 if more than 10 subfolders
+15 if bookmark-to-subfolder ratio is 2-10
Score range: 0-100
```

#### AI Confidence Score
```
Average confidence of all bookmarks in folder
Based on stored AI confidence metadata
Default: 50% if no metadata available
Score range: 0-100
```

### Storage

The feature uses Chrome's local storage for:
- **Favorite folders**: List of folder IDs
- **Access counts**: Tracking folder access frequency
- **AI confidence**: Per-bookmark confidence scores

Storage keys:
- `favoriteFolders`: Array of favorite folder IDs
- `folderAccessCounts`: Object mapping folder IDs to access counts
- `ai_confidence_${bookmarkId}`: Individual bookmark confidence scores

### Performance

- Folder stats are calculated on-demand
- Tree map generation is optimized for large hierarchies
- Comparison limited to 3 folders to maintain performance
- Access tracking is lightweight and non-blocking

## Best Practices

1. **Regular Health Checks**: Review folder health scores monthly
2. **Act on Suggestions**: Address high-priority suggestions promptly
3. **Use Favorites**: Bookmark frequently accessed folders for quick access
4. **Compare Similar Folders**: Use comparison to standardize organization
5. **Monitor Depth**: Keep folder depth at 3-4 levels maximum
6. **Balance Content**: Aim for 10-20 bookmarks per folder
7. **Review AI Confidence**: Manually verify low-confidence categorizations

## Troubleshooting

### No statistics showing
- Ensure you've selected a valid folder
- Try refreshing the stats
- Check that the folder contains bookmarks

### Health score seems incorrect
- Review the breakdown metrics to understand the calculation
- Consider the ideal ranges for each metric
- Check if subfolders are being counted correctly

### Tree map not generating
- Try a different root folder
- Check if the folder has subfolders
- Reduce the scope by selecting a lower-level folder

### Suggestions not appearing
- Suggestions only appear when issues are detected
- Try folders with more bookmarks
- Check folders with unusual structures

## Future Enhancements

Planned features:
- Automatic folder restructuring
- Historical health tracking
- Organization templates
- Bulk folder operations
- Export/import folder structures
- Machine learning for personalized suggestions
- Integration with bookmark tagging
- Collaboration features for shared bookmarks
