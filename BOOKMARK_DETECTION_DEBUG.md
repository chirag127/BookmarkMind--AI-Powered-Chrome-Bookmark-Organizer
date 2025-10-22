# BookmarkMind - Bookmark Detection Debug Guide

If the extension shows "0 bookmarks" or the sort button is disabled, follow these steps:

## 🔍 Quick Diagnosis

### Step 1: Check Extension Permissions
1. Go to `chrome://extensions/`
2. Find BookmarkMind extension
3. Click "Details"
4. Verify these permissions are granted:
   - ✅ Read and change your bookmarks
   - ✅ Store data on your device

### Step 2: Test Direct Bookmark Access
1. Open `test_bookmarks_simple.html` in Chrome
2. Click "Test Basic Bookmark Access"
3. Should show your actual bookmark count
4. If this fails, it's a permission issue

### Step 3: Check Browser Console
1. Right-click extension popup → "Inspect"
2. Go to Console tab
3. Look for error messages
4. Should see logs like "Found X bookmarks"

## 🛠️ Common Fixes

### Fix 1: Reload Extension
```
1. Go to chrome://extensions/
2. Click refresh icon on BookmarkMind
3. Try opening popup again
```

### Fix 2: Re-grant Permissions
```
1. Go to chrome://extensions/
2. Click "Remove" on BookmarkMind
3. Click "Load unpacked" and select folder again
4. Grant permissions when prompted
```

### Fix 3: Check Bookmark Location
The extension looks for bookmarks in:
- **Bookmarks Bar** (chrome://bookmarks/ → "Bookmarks bar")
- **Other Bookmarks** (chrome://bookmarks/ → "Other bookmarks")
- **Mobile Bookmarks** (chrome://bookmarks/ → "Mobile bookmarks")

If your bookmarks are in custom folders, they won't be detected.

### Fix 4: Manual Permission Grant
If Chrome didn't ask for permissions:
```
1. Go to chrome://extensions/
2. Click BookmarkMind "Details"
3. Scroll to "Permissions"
4. Ensure "Allow" is selected for bookmarks
```

## 🔧 Advanced Debugging

### Enable Debug Mode
Add this to popup console:
```javascript
// Test bookmark access directly
chrome.bookmarks.getTree().then(tree => {
  console.log('Bookmark tree:', tree);

  const bookmarks = [];
  function extract(node) {
    if (node.url) bookmarks.push(node);
    if (node.children) node.children.forEach(extract);
  }
  extract(tree[0]);

  console.log(`Found ${bookmarks.length} bookmarks`);
  console.log('Distribution:', {
    bookmarksBar: bookmarks.filter(b => b.parentId === '1').length,
    otherBookmarks: bookmarks.filter(b => b.parentId === '2').length,
    mobileBookmarks: bookmarks.filter(b => b.parentId === '3').length
  });
});
```

### Check Extension Context
```javascript
// Verify extension context
console.log('Extension context:', {
  hasChrome: typeof chrome !== 'undefined',
  hasBookmarks: typeof chrome?.bookmarks !== 'undefined',
  hasRuntime: typeof chrome?.runtime !== 'undefined'
});
```

## 📋 Troubleshooting Checklist

- [ ] Extension loaded without errors in chrome://extensions/
- [ ] Bookmark permission granted (shows in extension details)
- [ ] You have bookmarks in Bookmarks Bar/Other Bookmarks/Mobile Bookmarks
- [ ] Browser console shows "Found X bookmarks" message
- [ ] Extension popup shows correct bookmark count
- [ ] Sort button is enabled (not grayed out)

## 🚨 Known Issues

### Issue: "Cannot read properties of undefined"
**Cause**: Extension context not properly initialized
**Fix**: Reload extension and wait 2-3 seconds before opening popup

### Issue: Permissions not requested
**Cause**: Chrome didn't prompt for permissions during install
**Fix**: Remove and re-add extension, or manually grant in extension details

### Issue: Shows 0 bookmarks but you have many
**Cause**: Bookmarks are in subfolders, not main folders
**Fix**: Move some bookmarks to Bookmarks Bar to test

## 📞 Still Not Working?

If none of these steps work:

1. **Export your bookmarks** (chrome://bookmarks/ → ⋮ → Export bookmarks)
2. **Create a test bookmark** in Bookmarks Bar
3. **Try the extension** with just the test bookmark
4. **Report the issue** with:
   - Chrome version
   - Extension console logs
   - Results from test_bookmarks_simple.html

The extension requires access to Chrome's bookmark API, which should work on all standard Chrome installations. If it's not working, there may be a corporate policy or security software blocking the API access.