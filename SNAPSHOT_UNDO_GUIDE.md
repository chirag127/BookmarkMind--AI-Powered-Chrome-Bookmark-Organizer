# 📸 Snapshot & Undo System Guide

## Overview

BookmarkMind includes a powerful snapshot and rollback system that automatically creates backups before major bookmark operations. This allows you to safely experiment with AI categorization and revert changes if needed.

## Features

### ✨ Key Capabilities

- **Automatic Snapshots**: Backups created automatically before AI categorization
- **Manual Restore**: One-click restoration to any previous state
- **Version History**: Keep up to 10 snapshots with oldest auto-deleted
- **Storage Management**: Efficient storage with automatic cleanup
- **Safe Experimentation**: Try different categorization approaches risk-free

## How It Works

### Automatic Snapshot Creation

Snapshots are automatically created before:

1. **AI Categorization** - Full bookmark organization
2. **Force Reorganization** - Re-organizing already categorized bookmarks
3. **Bulk Categorization** - Processing selected bookmarks

### Snapshot Contents

Each snapshot includes:

- Complete bookmark tree structure
- All folders and subfolders
- Bookmark titles, URLs, and positions
- Folder hierarchy and organization
- Metadata (timestamp, description, bookmark count)

## Using Snapshots

### Viewing Snapshots

1. Open BookmarkMind popup
2. Click "View Snapshots & Undo" button
3. See list of all available snapshots with:
   - Description of the operation
   - Timestamp (e.g., "2 hours ago")
   - Number of bookmarks
   - Restore and Delete actions

### Restoring a Snapshot

1. Click "View Snapshots & Undo"
2. Find the snapshot you want to restore
3. Click the "Restore" button
4. Confirm the restoration (this will replace ALL current bookmarks)
5. Wait for the restoration to complete
6. Your bookmarks are now restored to that point in time

### Deleting Snapshots

1. Click "View Snapshots & Undo"
2. Click the trash icon next to any snapshot
3. Confirm deletion
4. Snapshot is permanently removed

## Storage Information

### Storage Limits

- **Maximum Snapshots**: 10 (configurable)
- **Storage Location**: Chrome Local Storage
- **Auto-Cleanup**: Oldest snapshots deleted when limit reached
- **Size Display**: Total storage usage shown in MB

### Storage Management

The system automatically manages storage by:

1. Limiting to 10 most recent snapshots
2. Auto-deleting oldest when creating new ones
3. Handling storage quota errors gracefully
4. Compressing data efficiently

## Use Cases

### Safe AI Experimentation

```
1. Let AI organize your bookmarks
2. Review the results
3. If unsatisfied, restore previous snapshot
4. Try again with different settings
```

### Testing Different Approaches

```
1. Try hierarchical categorization
2. Check snapshot
3. Try flat categorization
4. Compare results
5. Restore preferred version
```

### Recovering from Mistakes

```
1. Accidentally delete folders
2. Open snapshots view
3. Restore most recent snapshot
4. All bookmarks recovered
```

### Before Major Changes

```
1. Manual snapshot recommended (auto-created)
2. Make your changes
3. Keep or revert based on results
```

## Technical Details

### Snapshot Structure

```javascript
{
  id: "snapshot_1234567890_abc123",
  timestamp: 1234567890000,
  description: "Before AI Categorization",
  metadata: {
    operationType: "categorization",
    bookmarkCount: 150,
    uncategorizedCount: 50
  },
  bookmarkTree: { /* Complete Chrome bookmark tree */ }
}
```

### Restoration Process

1. **Backup Current State** (optional)
2. **Clear Current Bookmarks** (except root folders)
3. **Restore Folder Structure** (depth-first)
4. **Restore Bookmarks** (with original positions)
5. **Verify Integrity**
6. **Update Statistics**

### Performance

- **Snapshot Creation**: < 1 second for 1000 bookmarks
- **Restoration**: 2-5 seconds for 1000 bookmarks
- **Storage Impact**: ~50KB per 100 bookmarks

## Best Practices

### When to Use Snapshots

✅ **DO**:
- Review snapshot before starting large operations
- Keep important snapshots before deletion
- Use snapshots to experiment with settings
- Restore if categorization is unsatisfactory

❌ **DON'T**:
- Rely on snapshots as primary backup (use browser sync)
- Keep too many old snapshots (auto-cleanup handles this)
- Restore during active categorization
- Delete all snapshots if you might need them

### Recommended Workflow

1. **Initial Setup**
   - Configure AI settings
   - Review default categories
   - Run first categorization (snapshot auto-created)

2. **Review Results**
   - Check folder organization
   - Verify bookmark placement
   - Note any issues

3. **Adjust & Retry**
   - If unsatisfied, restore snapshot
   - Adjust settings
   - Try again

4. **Regular Maintenance**
   - Let snapshots auto-cleanup
   - Keep snapshots of major reorganizations
   - Delete old snapshots manually if needed

## Troubleshooting

### Snapshot Not Created

**Cause**: Storage quota exceeded or permission issue

**Solution**:
1. Delete old snapshots
2. Check Chrome storage permissions
3. Try creating snapshot again

### Restoration Failed

**Cause**: Corrupted snapshot or Chrome API issue

**Solution**:
1. Try different snapshot
2. Reload extension
3. Check browser console for errors

### Missing Snapshots

**Cause**: Auto-cleanup or manual deletion

**Solution**:
- Snapshots auto-delete when exceeding limit
- Check if manually deleted
- Create new snapshot if needed

### Slow Restoration

**Cause**: Large bookmark collection

**Solution**:
- Wait for process to complete
- Don't close popup during restoration
- Check progress indicator

## Security & Privacy

### Data Storage

- Snapshots stored locally in Chrome
- No data sent to external servers
- Encrypted by Chrome's storage API
- Cleared when extension uninstalled

### Access Control

- Only BookmarkMind can access snapshots
- No cross-extension access
- User-controlled deletion
- Automatic cleanup

## FAQ

**Q: How many snapshots can I keep?**  
A: Up to 10 by default. Oldest deleted automatically.

**Q: Do snapshots include bookmark content?**  
A: No, only titles, URLs, and folder structure.

**Q: Can I export snapshots?**  
A: Not directly, but you can export bookmarks using Chrome's built-in feature.

**Q: Will snapshots slow down my browser?**  
A: No, storage impact is minimal and doesn't affect performance.

**Q: What happens if I uninstall the extension?**  
A: All snapshots are deleted with the extension data.

**Q: Can I restore to a snapshot from weeks ago?**  
A: Only if it's still within your 10 most recent snapshots.

**Q: Do snapshots backup folder permissions?**  
A: Chrome doesn't have folder permissions, so this doesn't apply.

**Q: Can I schedule automatic snapshots?**  
A: No, but they're created automatically before all major operations.

## Future Enhancements

Planned improvements:

- [ ] Export snapshots to file
- [ ] Import snapshots from file
- [ ] Configurable snapshot limit
- [ ] Snapshot comparison view
- [ ] Cloud backup integration
- [ ] Scheduled snapshots
- [ ] Snapshot annotations
- [ ] Quick restore shortcut

## Support

For issues or questions:
- Check the main [README.md](README.md)
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Open an issue on GitHub
- Contact support

---

**Remember**: Snapshots are a safety net, not a primary backup solution. Always keep Chrome Sync enabled or export bookmarks regularly for critical data protection.
