/**
 * BookmarkMind - Background Script (Service Worker)
 * Handles extension lifecycle and background processing
 */

// Initialize extension on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('BookmarkMind extension started');
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('BookmarkMind extension installed/updated');

  if (details.reason === 'install') {
    // First time installation
    await initializeExtension();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log(`Updated from version ${details.previousVersion}`);
  }
});

/**
 * Initialize extension with default settings
 */
async function initializeExtension() {
  try {
    const defaultSettings = {
      apiKey: '',
      categories: [
        'Work',
        'Personal',
        'Shopping',
        'Entertainment',
        'News',
        'Social',
        'Learning',
        'Other'
      ],
      lastSortTime: 0,
      autoSort: false,
      batchSize: 50
    };

    // Check if settings already exist
    const existing = await chrome.storage.sync.get(['bookmarkMindSettings']);

    if (!existing.bookmarkMindSettings) {
      await chrome.storage.sync.set({
        bookmarkMindSettings: defaultSettings
      });
      console.log('Initialized default settings');
    }

    // Initialize learning data storage
    const existingLearning = await chrome.storage.sync.get(['bookmarkMindLearning']);
    if (!existingLearning.bookmarkMindLearning) {
      await chrome.storage.sync.set({
        bookmarkMindLearning: {}
      });
      console.log('Initialized learning data storage');
    }

  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Handle messages from popup and options pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.action) {
    case 'startCategorization':
      handleCategorization(message.data, sendResponse);
      return true; // Keep message channel open for async response

    case 'testApiKey':
      handleApiKeyTest(message.data, sendResponse);
      return true;

    case 'getStats':
      handleGetStats(sendResponse);
      return true;

    case 'exportBookmarks':
      handleExportBookmarks(sendResponse);
      return true;

    default:
      console.warn('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

/**
 * Handle bookmark categorization request
 */
async function handleCategorization(data, sendResponse) {
  try {
    // Import required modules (they're loaded as content scripts)
    const categorizer = new Categorizer();

    // Initialize with current settings
    const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
    await categorizer.initialize(settings.bookmarkMindSettings);

    // Start categorization with progress updates
    const results = await categorizer.categorizeAllBookmarks((progress) => {
      // Send progress updates to popup
      chrome.runtime.sendMessage({
        action: 'categorizationProgress',
        data: progress
      }).catch(() => {
        // Ignore errors if popup is closed
      });
    });

    // Update last sort time
    const updatedSettings = {
      ...settings.bookmarkMindSettings,
      lastSortTime: Date.now()
    };
    await chrome.storage.sync.set({ bookmarkMindSettings: updatedSettings });

    sendResponse({ success: true, data: results });

  } catch (error) {
    console.error('Categorization error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Categorization failed'
    });
  }
}

/**
 * Handle API key test request
 */
async function handleApiKeyTest(data, sendResponse) {
  try {
    const aiProcessor = new AIProcessor();
    aiProcessor.setApiKey(data.apiKey);

    const isValid = await aiProcessor.testApiKey();
    sendResponse({ success: true, valid: isValid });

  } catch (error) {
    console.error('API key test error:', error);
    sendResponse({
      success: false,
      error: error.message || 'API key test failed'
    });
  }
}

/**
 * Handle stats request
 */
async function handleGetStats(sendResponse) {
  try {
    console.log('Background: Getting stats...');

    // Test direct bookmark access first
    try {
      const tree = await chrome.bookmarks.getTree();
      console.log('Background: Direct bookmark access successful, tree length:', tree.length);
    } catch (directError) {
      console.error('Background: Direct bookmark access failed:', directError);
      sendResponse({
        success: false,
        error: 'Cannot access bookmarks: ' + directError.message
      });
      return;
    }

    const categorizer = new Categorizer();
    const stats = await categorizer.getStats();

    console.log('Background stats calculated:', stats);
    sendResponse({ success: true, data: stats });

  } catch (error) {
    console.error('Background stats error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to get stats'
    });
  }
}

/**
 * Handle bookmark export request
 */
async function handleExportBookmarks(sendResponse) {
  try {
    const folderManager = new FolderManager();
    const exportData = await folderManager.exportOrganization();

    sendResponse({ success: true, data: exportData });

  } catch (error) {
    console.error('Export error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Export failed'
    });
  }
}

// Handle bookmark changes for learning
chrome.bookmarks.onMoved.addListener(async (id, moveInfo) => {
  try {
    // This could be used to detect when user manually moves bookmarks
    // and learn from their preferences
    console.log(`Bookmark ${id} moved from ${moveInfo.oldParentId} to ${moveInfo.parentId}`);

    // TODO: Implement learning from manual moves
    // This would analyze the bookmark and its new location to improve future categorizations

  } catch (error) {
    console.error('Error handling bookmark move:', error);
  }
});

// Cleanup on extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('BookmarkMind extension suspending');
});

console.log('BookmarkMind background script loaded');