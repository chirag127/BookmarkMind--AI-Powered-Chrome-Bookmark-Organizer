# 🔑 API Key Troubleshooting Guide

If you're getting "Failed to test API key" error, follow these steps:

## 🔍 Step 1: Verify Your API Key

### Check API Key Format
Your Gemini API key should:
- ✅ Start with "AIza"
- ✅ Be exactly 39 characters long
- ✅ Contain only letters, numbers, hyphens, and underscores
- ✅ Be from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Example Valid Format:
```
AIzaSyDummyKeyForTesting1234567890ABCDEF
```

## 🔍 Step 2: Get a Fresh API Key

1. **Go to** [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Sign in** with your Google account
3. **Click** "Create API Key"
4. **Copy** the entire key (starts with "AIza")
5. **Make sure** Gemini API access is enabled

## 🔍 Step 3: Test API Key Directly

**Run this test in the service worker console:**

1. Go to `chrome://extensions/`
2. Find BookmarkMind → Click "Inspect views: service worker"
3. Copy and paste the contents of `test_api_key_direct.js`
4. Press Enter and check the results

## 🔍 Step 4: Common API Key Issues

### Issue: "API key should start with AIza"
**Fix:** Get a new key from Google AI Studio, not Google Cloud Console

### Issue: "API key too short"
**Fix:** Make sure you copied the complete key (39 characters)

### Issue: "403 Forbidden" or "Access Denied"
**Fix:**
1. Enable Gemini API in your Google Cloud project
2. Make sure billing is enabled (free tier available)
3. Check API quotas and limits

### Issue: "401 Unauthorized"
**Fix:**
1. Regenerate API key in Google AI Studio
2. Make sure you're using the correct key
3. Check if key has expired

## 🔍 Step 5: Extension-Specific Issues

### Issue: "Failed to test API key. Please try again."
**Possible causes:**
1. **Service worker not loaded** → Reload extension
2. **Network connectivity** → Check internet connection
3. **Extension permissions** → Check in chrome://extensions/
4. **API key format** → Verify starts with "AIza"

### Issue: Test hangs or times out
**Fix:**
1. Check your internet connection
2. Try a different network (mobile hotspot)
3. Disable VPN if using one
4. Check firewall settings

## 🔍 Step 6: Manual API Test

If the extension test fails, try this manual test:

```javascript
// Run this in any browser console (F12)
async function manualApiTest() {
  const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual key

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, please respond with "API test successful"'
          }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API test successful:', data);
    } else {
      const error = await response.text();
      console.error('❌ API test failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

manualApiTest();
```

## 🔍 Step 7: Alternative Solutions

### If API key keeps failing:

1. **Try a different Google account**
2. **Create a new Google Cloud project**
3. **Use a different browser** (incognito mode)
4. **Check corporate firewall** (if on work network)

### If extension won't accept valid key:

1. **Clear extension data:**
   - Go to chrome://extensions/
   - Click BookmarkMind "Details"
   - Click "Extension options"
   - Click "Reset All Settings"

2. **Reload extension completely:**
   - Remove extension
   - Re-add with "Load unpacked"
   - Configure API key again

## 🆘 Still Having Issues?

If none of these steps work:

1. **Run the direct API test** (`test_api_key_direct.js`)
2. **Check the console output** for specific error messages
3. **Try the manual API test** outside the extension
4. **Report the issue** with:
   - Console error messages
   - API key format (first 4 characters only)
   - Chrome version
   - Network setup (VPN, corporate, etc.)

## ✅ Success Indicators

The API key is working when:
- ✅ Direct test shows "API call successful!"
- ✅ Extension test shows "API key is valid!"
- ✅ Manual test returns AI response
- ✅ No 401/403 errors in console