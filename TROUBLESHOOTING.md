# BookmarkMind Troubleshooting Guide

This guide helps resolve common issues with the BookmarkMind extension.

## 🔧 API Key Issues

### Problem: "Test API Key" and "Save API Key" buttons are disabled

**Symptoms:**
- Buttons remain grayed out even after entering API key
- Cannot click Test or Save buttons

**Solutions:**

1. **Check API Key Format**
   - API keys should start with `AIza`
   - Should be about 39 characters long
   - Example: `AIzaSyDummyKeyForTesting1234567890`

2. **Clear and Re-enter Key**
   - Click the ✕ (clear) button next to the API key field
   - Type or paste your API key fresh
   - Buttons should enable when you type a valid-looking key

3. **Use the Debug Page**
   - Open `debug_options.html` in your browser
   - Test different API key formats
   - This helps identify if the issue is with validation logic

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages or debug logs
   - Should see messages like "API Key input changed" when typing

**Expected Behavior:**
- Buttons should enable when you type an API key that starts with "AIza" OR is longer than 20 characters
- Console should show debug messages when you type

### Problem: "Invalid API key" error when testing

**Symptoms:**
- Buttons are enabled but test fails
- Error message shows "Invalid API key"

**Solutions:**

1. **Verify API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Generate a new API key
   - Copy the entire key (starts with AIza)

2. **Check API Permissions**
   - Ensure your Google account has access to Gemini API
   - Try the API key in Google AI Studio first

3. **Network Issues**
   - Check internet connection
   - Disable VPN if using one
   - Try again in a few minutes (rate limiting)

## 🚫 Extension Loading Issues

### Problem: Extension doesn't appear in Chrome

**Solutions:**

1. **Check Extension Loading**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Look for BookmarkMind in the list
   - If not there, click "Load unpacked" and select the folder

2. **Verify File Structure**
   - Open `test_extension.html` to check files
   - Ensure `manifest.json` is in the root folder
   - All required files should be present

3. **Check for Errors**
   - Look for red error text in `chrome://extensions/`
   - Click "Errors" button if present
   - Fix any JavaScript or manifest errors

### Problem: Extension icon doesn't appear in toolbar

**Solutions:**

1. **Pin the Extension**
   - Click the puzzle piece icon (🧩) in Chrome toolbar
   - Find "BookmarkMind" in the dropdown
   - Click the pin icon (📌) to keep it visible

2. **Check Extension Status**
   - Go to `chrome://extensions/`
   - Ensure BookmarkMind is enabled (toggle switch on)

## 📚 Bookmark Organization Issues

### Problem: "0 uncategorized bookmarks" but I have many bookmarks

**Explanation:**
The extension only organizes bookmarks that are directly in the **Bookmarks Bar**, not in folders.

**Solutions:**

1. **Move Bookmarks to Bookmarks Bar**
   - Open Bookmark Manager (`Ctrl+Shift+O`)
   - Drag bookmarks from folders to "Bookmarks bar"
   - Refresh the extension popup

2. **Check Bookmark Location**
   - Only bookmarks in the top-level Bookmarks Bar are processed
   - Bookmarks already in folders are considered "organized"

### Problem: Sorting is very slow or fails

**Solutions:**

1. **Reduce Batch Size**
   - Go to Settings → Advanced Settings
   - Change batch size from 50 to 25
   - Try sorting again

2. **Check Internet Connection**
   - Ensure stable internet for API calls
   - Try again during off-peak hours

3. **Large Collections**
   - Collections over 500 bookmarks take longer
   - Be patient - progress is shown in popup
   - Consider organizing in smaller batches

## 🔍 Debugging Steps

### Step 1: Check Browser Console

1. Right-click on extension popup → "Inspect"
2. Go to Console tab
3. Look for error messages or warnings
4. Try the action again and watch for new messages

### Step 2: Test with Debug Page

1. Open `debug_options.html` in browser
2. Test API key input and button behavior
3. Compare with actual extension behavior

### Step 3: Verify Extension Files

1. Open `test_extension.html` in browser
2. Check that all files are present
3. Look for any missing files or errors

### Step 4: Reset Extension

1. Go to `chrome://extensions/`
2. Click "Remove" on BookmarkMind
3. Reload the unpacked extension
4. Reconfigure API key

## 📞 Getting Help

If these steps don't resolve your issue:

1. **GitHub Issues**: [Report a bug](https://github.com/bookmarkmind/bookmarkmind/issues)
2. **Include Information**:
   - Chrome version
   - Extension version
   - Error messages from console
   - Steps to reproduce the issue
   - Screenshots if helpful

## 🔧 Advanced Debugging

### Enable Verbose Logging

Add this to the top of `options/options.js`:

```javascript
// Enable debug mode
window.DEBUG_MODE = true;
```

This will show more detailed console messages.

### Manual API Test

Test the Gemini API directly:

```javascript
// Run in browser console
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: 'Hello, test message'
      }]
    }]
  })
})
.then(response => response.json())
.then(data => console.log('API Response:', data))
.catch(error => console.error('API Error:', error));
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

## ✅ Quick Checklist

Before reporting an issue, verify:

- [ ] Chrome Developer mode is enabled
- [ ] Extension is loaded and enabled
- [ ] API key starts with "AIza" and is complete
- [ ] Bookmarks are in Bookmarks Bar (not folders)
- [ ] Internet connection is stable
- [ ] No errors in browser console
- [ ] Tried clearing and re-entering API key

Most issues are resolved by clearing and re-entering the API key or moving bookmarks to the Bookmarks Bar.