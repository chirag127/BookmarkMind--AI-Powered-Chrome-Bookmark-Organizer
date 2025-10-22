# BookmarkMind - AI-Powered Chrome Bookmark Organizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chrome.google.com/webstore)

BookmarkMind is a Chrome extension that uses Google's Gemini AI to automatically categorize and organize your bookmarks into intelligent folders. Say goodbye to bookmark chaos and hello to an organized browsing experience!

## ✨ Features

- **AI-Powered Categorization**: Uses Google Gemini API to intelligently sort bookmarks
- **Custom Categories**: Create and manage your own category structure with nested folders
- **Learning System**: Improves over time by learning from your manual corrections
- **Batch Processing**: Efficiently handles large bookmark collections (1000+ bookmarks)
- **Privacy-Focused**: All processing happens locally, your data stays private
- **Cross-Browser**: Works on Chrome, Edge, Brave, and all Chromium browsers
- **Export Functionality**: Export your organized bookmark structure
- **Zero Setup**: Ready to use in minutes after installation

## 🚀 Quick Start

### 1. Installation

#### Option A: Load as Unpacked Extension (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the BookmarkMind folder (containing `manifest.json`)
5. The extension icon will appear in your toolbar
6. **Important**: If you don't see the icon, click the puzzle piece (🧩) and pin BookmarkMind

#### ⚠️ Troubleshooting Installation
If the extension shows "0 bookmarks" or errors:
1. **Check permissions**: Go to chrome://extensions/ → BookmarkMind → Details → Ensure bookmark permissions are granted
2. **Verify bookmarks**: You need bookmarks in "Bookmarks Bar", "Other Bookmarks", or "Mobile Bookmarks" (not subfolders)
3. **Test installation**: Open `extension_test.html` for step-by-step diagnosis
4. **Check console**: Right-click popup → Inspect → Console for error messages

#### Option B: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon!

### 2. Setup Your API Key

1. Get a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click the BookmarkMind extension icon in your toolbar
3. Click "Settings" (gear icon)
4. Enter your API key and click "Save API Key"
5. Test the key to ensure it's working

### 3. Organize Your Bookmarks

1. Click the BookmarkMind extension icon
2. Click "Sort Bookmarks Now"
3. Watch as AI organizes your bookmarks into categories like:
   - Work
   - Personal
   - Shopping
   - Entertainment
   - News
   - Social
   - Learning

## 📋 Requirements

- **Browser**: Chrome 88+ or any Chromium-based browser
- **API Key**: Free Google Gemini API key
- **Permissions**: Bookmarks and Storage (automatically requested)

## 🛠️ Configuration

### Default Categories

BookmarkMind comes with these default categories:
- Work
- Personal
- Shopping
- Entertainment
- News
- Social
- Learning
- Other

### Custom Categories

You can add custom categories in Settings:
- Simple categories: `Photography`
- Nested categories: `Work/Projects/Current`
- Edit or delete existing categories
- Categories are synced across devices

### Advanced Settings

- **Batch Size**: Adjust how many bookmarks to process at once (25-100)
- **Empty Folder Cleanup**: Automatically remove empty folders after organizing
- **Learning Data**: View and manage AI learning patterns

## 🔧 How It Works

1. **Reading Bookmarks**: Uses Chrome Bookmarks API to access your bookmarks
2. **AI Analysis**: Sends bookmark titles and URLs to Gemini API for categorization
3. **Smart Organization**: Creates folders and moves bookmarks based on AI recommendations
4. **Learning**: Records your manual corrections to improve future categorizations
5. **Batch Processing**: Handles large collections efficiently with progress tracking

## 🔒 Privacy & Security

- **Local Processing**: All bookmark organization happens in your browser
- **API Key Security**: Your Gemini API key is encrypted and stored locally
- **No Data Collection**: We don't collect or store your bookmark data
- **Open Source**: Full source code available for review
- **Minimal Permissions**: Only requests necessary bookmark and storage permissions

## 📊 Performance

- **Small Collections** (< 100 bookmarks): ~30 seconds
- **Medium Collections** (100-500 bookmarks): ~2-5 minutes
- **Large Collections** (500+ bookmarks): ~5-15 minutes
- **Batch Processing**: Prevents browser freezing during organization
- **Progress Tracking**: Real-time updates on organization progress

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature description"`
5. Push to your fork: `git push origin feature-name`
6. Create a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/bookmarkmind/bookmarkmind.git
cd bookmarkmind

# Load the extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this folder

# Make changes and reload the extension to test
```

### Code Structure

```
bookmarkmind/
├── manifest.json          # Extension manifest
├── popup/                 # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/               # Settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
├── scripts/               # Core functionality
│   ├── background.js      # Service worker
│   ├── bookmarkService.js # Bookmark operations
│   ├── aiProcessor.js     # Gemini API integration
│   ├── categorizer.js     # Main orchestrator
│   └── folderManager.js   # Folder operations
└── icons/                 # Extension icons
```

## 🐛 Troubleshooting

### Common Issues

**Extension not working after installation**
- Ensure you have a valid Gemini API key
- Check that the extension has bookmark permissions
- Try refreshing the extension in chrome://extensions/

**API key errors**
- Verify your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Ensure the key has proper permissions
- Check your API quota limits

**Slow processing**
- Reduce batch size in Advanced Settings
- Check your internet connection
- Large collections naturally take longer

**Bookmarks not organizing correctly**
- Check that bookmarks are in the Bookmarks Bar (not in folders)
- Manually correct a few categorizations to improve AI learning
- Verify your custom categories are set up correctly

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/bookmarkmind/bookmarkmind/issues)
- **Documentation**: Check this README and inline help
- **Community**: Join discussions in GitHub Discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI**: For providing the AI categorization capabilities
- **Chrome Extensions API**: For enabling seamless browser integration
- **Open Source Community**: For inspiration and best practices
- **Contributors**: Everyone who helps improve BookmarkMind

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)
- [ ] Firefox support
- [ ] Bookmark deduplication
- [ ] Import/export bookmark organization
- [ ] Scheduled automatic sorting

### Version 1.2 (Future)
- [ ] Multiple AI provider support (OpenAI, Claude)
- [ ] Bookmark content analysis
- [ ] Team/shared category templates
- [ ] Advanced analytics dashboard

## 📈 Stats

- **Development Time**: 6 weeks
- **Lines of Code**: ~2,000
- **Supported Browsers**: Chrome, Edge, Brave, Opera
- **Target Users**: Power users with 100+ bookmarks
- **Performance**: Handles 2,000+ bookmarks efficiently

---

**Made with ❤️ for better bookmark organization**

[⭐ Star this repo](https://github.com/bookmarkmind/bookmarkmind) | [🐛 Report Bug](https://github.com/bookmarkmind/bookmarkmind/issues) | [💡 Request Feature](https://github.com/bookmarkmind/bookmarkmind/issues)