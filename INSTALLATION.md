# BookmarkMind Installation Guide

This guide will help you install and set up BookmarkMind in just a few minutes.

## 📋 Prerequisites

Before installing BookmarkMind, make sure you have:

1. **Chrome Browser** (version 88 or later) or any Chromium-based browser (Edge, Brave, Opera)
2. **Google Gemini API Key** (free) - [Get one here](https://makersuite.google.com/app/apikey)
3. **Bookmarks to organize** - The extension works best with 10+ bookmarks

## 🚀 Installation Methods

### Method 1: Load as Unpacked Extension (Recommended for Testing)

This method is perfect for trying out BookmarkMind or contributing to development.

#### Step 1: Download the Extension
```bash
# Option A: Clone with Git
git clone https://github.com/bookmarkmind/bookmarkmind.git
cd bookmarkmind

# Option B: Download ZIP
# Go to https://github.com/bookmarkmind/bookmarkmind
# Click "Code" → "Download ZIP"
# Extract the ZIP file to a folder
```

#### Step 2: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle switch in the top right)
3. Click **"Load unpacked"**
4. Select the `bookmarkmind` folder you just downloaded
5. The BookmarkMind icon should appear in your toolbar

#### Step 3: Pin the Extension (Optional)
1. Click the puzzle piece icon (🧩) in Chrome's toolbar
2. Find "BookmarkMind" in the list
3. Click the pin icon (📌) to keep it visible

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store for easy one-click installation.

## 🔑 API Key Setup

### Step 1: Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key (starts with `AIza...`)

### Step 2: Configure the Extension
1. Click the BookmarkMind icon in your toolbar
2. Click the **Settings** button (⚙️ gear icon)
3. Paste your API key in the **"Gemini API Key"** field
4. Click **"Test API Key"** to verify it works
5. Click **"Save API Key"**

✅ **Success!** You should see "API key is valid!" message.

## 📚 First Use

### Step 1: Check Your Bookmarks
1. Make sure you have some bookmarks in your **Bookmarks Bar**
2. Bookmarks in folders won't be processed (they're considered already organized)
3. The extension works best with at least 10-20 uncategorized bookmarks

### Step 2: Run Your First Organization
1. Click the BookmarkMind icon
2. You should see the number of uncategorized bookmarks
3. Click **"Sort X Bookmarks"** button
4. Watch the progress as AI organizes your bookmarks
5. Check your bookmarks bar to see the new organized folders!

### Step 3: Customize Categories (Optional)
1. Go to Settings (⚙️ icon)
2. Scroll to the **"Categories"** section
3. Add, edit, or remove categories as needed
4. Use `/` for nested categories (e.g., `Work/Projects/Current`)

## 🔧 Verification Steps

After installation, verify everything is working:

### ✅ Extension Loaded
- [ ] BookmarkMind icon appears in toolbar
- [ ] Clicking icon opens popup window
- [ ] Settings page opens when clicking gear icon

### ✅ API Key Working
- [ ] API key saved successfully
- [ ] Test shows "API key is valid!"
- [ ] No error messages in popup

### ✅ Bookmarks Accessible
- [ ] Extension shows correct bookmark count
- [ ] "Sort Bookmarks" button is enabled
- [ ] No permission errors

### ✅ First Organization
- [ ] Sorting process completes without errors
- [ ] New folders appear in bookmarks bar
- [ ] Bookmarks are moved to appropriate categories

## 🐛 Troubleshooting

### Extension Won't Load
**Problem**: Extension doesn't appear after loading
**Solutions**:
- Refresh the extensions page (`chrome://extensions/`)
- Make sure you selected the correct folder (should contain `manifest.json`)
- Check that Developer mode is enabled
- Try restarting Chrome

### API Key Issues
**Problem**: "Invalid API key" error
**Solutions**:
- Double-check you copied the complete key from Google AI Studio
- Ensure the key starts with `AIza`
- Try generating a new key
- Check your Google account has API access enabled

### No Bookmarks to Sort
**Problem**: Extension shows "0 uncategorized bookmarks"
**Solutions**:
- Add some bookmarks to your Bookmarks Bar
- Move existing bookmarks out of folders to the Bookmarks Bar
- The extension only processes bookmarks directly in the Bookmarks Bar

### Slow Performance
**Problem**: Sorting takes a very long time
**Solutions**:
- Reduce batch size in Advanced Settings (try 25 instead of 50)
- Check your internet connection
- Large collections (500+ bookmarks) naturally take longer
- Consider organizing in smaller batches

### Permission Errors
**Problem**: Extension can't access bookmarks
**Solutions**:
- Reload the extension in `chrome://extensions/`
- Check that bookmark permissions are granted
- Try removing and re-adding the extension

## 🔄 Updating the Extension

### For Unpacked Extensions
1. Download the latest version from GitHub
2. Replace the old folder with the new one
3. Go to `chrome://extensions/`
4. Click the refresh icon (🔄) on the BookmarkMind extension
5. Your settings and API key will be preserved

### For Chrome Web Store (Future)
Updates will be automatic when available on the Chrome Web Store.

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** - Most common issues are covered here
2. **GitHub Issues** - [Report bugs or ask questions](https://github.com/bookmarkmind/bookmarkmind/issues)
3. **Documentation** - Check the main [README.md](README.md) for detailed information
4. **Community** - Join discussions in GitHub Discussions

## 🎉 You're Ready!

Congratulations! BookmarkMind is now installed and ready to organize your bookmarks.

**Next Steps**:
- Try organizing your bookmarks
- Customize categories to match your workflow
- Manually correct any miscategorizations to improve AI learning
- Export your organized structure as backup

Happy organizing! 🚀