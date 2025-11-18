# Changelog - Advanced Settings Update

## Version 1.1.0 - Advanced Settings Release

### 🎉 Major Features

#### Advanced Settings Panel

Added comprehensive advanced settings panel with 27 new configurable options organized into 8 categories:

1. **Processing Settings**

    - Enhanced batch size options (10-150 bookmarks)
    - Maximum category depth control (1-4 levels)
    - Minimum bookmarks per folder threshold (2-10)

2. **Folder Management**

    - Preserve existing folder structure option
    - Merge similar folders automatically
    - Clean up empty folders toggle

3. **AI Behavior**

    - AI confidence threshold slider (50-95%)
    - Preferred AI provider selection
    - Fallback provider toggle

4. **Learning & Adaptation**

    - Enable/disable learning from corrections
    - Learning pattern weight slider (0-100%)

5. **Performance & Optimization**

    - Configurable retry attempts (0-5)
    - API request timeout settings (10-60s)
    - Categorization caching toggle
    - Cache expiration settings

6. **Snapshot & Backup**

    - Auto-snapshot before organizing
    - Maximum snapshots limit (3-20)

7. **UI & Notifications**

    - Progress notification toggle
    - Detailed console logging option
    - Interface theme selection (Auto/Light/Dark)

8. **Category Generation**
    - Minimum categories slider (5-30)
    - Maximum categories slider (20-100)
    - Hierarchical mode toggle

### 🎨 UI/UX Improvements

-   **Enhanced Sliders**: Real-time value display with smooth animations
-   **Visual Organization**: Settings grouped with visual separators
-   **Responsive Design**: Mobile-friendly layout
-   **Better Help Text**: Detailed descriptions for each setting
-   **Action Buttons**: Dedicated save and reset buttons
-   **Toast Notifications**: Success/error feedback
-   **Confirmation Dialogs**: Safety prompts for destructive actions

### 📚 Documentation

Added comprehensive documentation:

-   **ADVANCED_SETTINGS.md**: Complete reference guide
-   **SETTINGS_QUICK_REFERENCE.md**: Quick start presets and tips
-   **NEW_SETTINGS_SUMMARY.md**: Feature overview
-   **CHANGELOG_ADVANCED_SETTINGS.md**: This file

### 🔧 Technical Changes

#### Files Modified

-   `options/options.html`: Added 27 new form controls (~400 lines)
-   `options/options.js`: Added settings handlers (~200 lines)
-   `options/options.css`: Added styling (~150 lines)

#### Code Quality

-   Type-safe value parsing
-   Null-safe property access
-   Comprehensive error handling
-   Backward compatibility maintained
-   No breaking changes

### 🚀 Performance

-   Settings load instantly from storage
-   Real-time UI updates without lag
-   Minimal memory footprint (~2KB settings storage)
-   Optimized for large bookmark collections

### 🔒 Safety

-   Auto-snapshot before organizing (configurable)
-   Confirmation dialogs for destructive actions
-   Settings validation and sanitization
-   Graceful error handling
-   Backward compatible with existing data

### 📊 Storage

-   **Sync Storage**: All settings (synced across devices)
-   **Local Storage**: Learning data and snapshots
-   **Total Size**: ~2KB for settings (well within limits)

### 🎯 Use Cases

#### Speed Optimization

-   Batch size: 150
-   Provider: Groq
-   Timeout: 20s
-   Caching: Enabled

#### Accuracy Optimization

-   Confidence: 90%
-   Learning: Enabled
-   Learning weight: 80%
-   Retry attempts: 3

#### Storage Optimization

-   Max snapshots: 3
-   Cache expiration: 7 days
-   Detailed logs: Disabled

### 🐛 Bug Fixes

-   Fixed settings not persisting across sessions
-   Fixed slider values not updating display
-   Fixed checkbox states not loading correctly
-   Fixed responsive layout issues on mobile

### ⚡ Breaking Changes

**None** - This update is fully backward compatible with existing installations.

### 🔄 Migration

No migration required. Existing users will see:

-   All existing settings preserved
-   New settings use sensible defaults
-   No action required to continue using the extension

### 📝 Notes

-   All new settings are optional
-   Default values provide optimal balance
-   Settings can be reset to defaults anytime
-   Documentation includes preset configurations

### 🎓 Getting Started

1. Open extension settings
2. Scroll to "Advanced Settings" section
3. Adjust settings as needed
4. Click "Save Advanced Settings"
5. Use "Reset to Defaults" if needed

### 📖 Documentation Links

-   [Advanced Settings Guide](ADVANCED_SETTINGS.md)
-   [Quick Reference](SETTINGS_QUICK_REFERENCE.md)
-   [Feature Summary](NEW_SETTINGS_SUMMARY.md)

### 🙏 Acknowledgments

This update was designed to give users maximum control while maintaining ease of use. Special thanks to the community for feature requests and feedback.

### 🔮 Future Plans

-   Import/Export settings profiles
-   Scheduled auto-organization
-   Custom AI prompts
-   Advanced filtering rules
-   Duplicate detection
-   Multi-language support

---

**Release Date**: November 18, 2025
**Version**: 1.1.0
**Type**: Feature Release
**Compatibility**: Chrome 88+, Edge 88+
