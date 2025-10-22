# 🔍 Extension Status Checker

Follow these steps to check if BookmarkMind is working correctly:

## 1. Extension Loading Status

**Go to `chrome://extensions/`**

✅ **Check these items:**
- [ ] BookmarkMind is listed
- [ ] Toggle switch is ON (enabled)
- [ ] No red error messages
- [ ] "Inspect views: service worker" link is visible

❌ **If you see errors:**
- Remove extension and reload it
- Make sure you selected the correct folder (containing manifest.json)

## 2. Service Worker Status

**Click "Inspect views: service worker"**

✅ **Should see in console:**
```
Background scripts loaded successfully
Available classes: {BookmarkService: true, AIProcessor: true, ...}
```

❌ **If you see errors:**
- "Failed to load background scripts" → Reload extension
- "Class not available" → Check file paths in scripts folder

## 3. Popup Status

**Click BookmarkMind icon in toolbar**

✅ **Should show:**
- Bookmark count (not "-" or "0" if you have bookmarks)
- Green status dot with "Ready to organize X bookmarks"
- Enabled "Sort Bookmarks Now" button

❌ **If you see:**
- Red status dot → No bookmarks detected or API key missing
- Yellow status dot → API key required
- Gray button → Extension not ready

## 4. Settings Status

**Click Settings (⚙️) in popup**

✅ **Should work:**
- Settings page opens without errors
- API key field accepts input
- "Test API Key" works (shows "API key is valid!")
- Categories list shows default categories

## 5. Console Debugging

**Run the debug scripts:**

1. **Service Worker Console:** Run `quick_debug.js`
2. **Popup Console:** Run `manual_test_popup.js`

## 6. Common Issues & Fixes

### Issue: "Failed to start categorization"
**Possible causes:**
1. Service worker not loaded → Reload extension
2. API key invalid → Check format (starts with "AIza")
3. No bookmarks found → Add bookmarks to main folders
4. Chrome API access denied → Check permissions

### Issue: No response from background
**Fix:**
1. Go to chrome://extensions/
2. Reload BookmarkMind extension
3. Wait 5 seconds before testing
4. Check service worker console for errors

### Issue: Classes not defined
**Fix:**
1. Check all .js files are in scripts/ folder
2. Reload extension completely
3. Check for JavaScript syntax errors

## 7. Quick Test Sequence

1. **Reload extension** (chrome://extensions/)
2. **Wait 5 seconds**
3. **Check service worker console** (should show "scripts loaded")
4. **Open popup** (should show bookmark count)
5. **Test categorization** (should work without errors)

If any step fails, that's where the problem is!