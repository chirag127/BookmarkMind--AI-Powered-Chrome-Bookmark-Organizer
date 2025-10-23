/**
 * BookmarkMind - Background Script (Service Worker)
 * Handles extension lifecycle and background processing
 */

// Import required modules using importScripts for Manifest V3
try {
  importScripts(
    'bookmarkService.js',
    'aiProcessor.js',
    'categorizer.js',
    'folderManager.js'
  );
  console.log('Background scripts loaded successfully');

  // Verify classes are available
  console.log('Available classes:', {
    BookmarkService: typeof BookmarkService !== 'undefined',
    AIProcessor: typeof AIProcessor !== 'undefined',
    Categorizer: typeof Categorizer !== 'undefined',
    FolderManager: typeof FolderManager !== 'undefined'
  });

} catch (error) {
  console.error('Failed to load background scripts:', error);
  console.log('Will create instances dynamically if needed');
}

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
      hierarchicalMode: true,
      maxCategoryDepth: 4,
      minCategories: 15,
      maxCategories: 50,
      lastSortTime: 0,
      autoSort: false,
      batchSize: 50,
      cleanupEmptyFolders: false,
      agentRouterApiKey: '' // AgentRouter fallback API key
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

// Ensure classes are loaded before handling messages
async function ensureClassesLoaded() {
  if (typeof Categorizer === 'undefined' ||
    typeof BookmarkService === 'undefined' ||
    typeof AIProcessor === 'undefined' ||
    typeof FolderManager === 'undefined') {

    console.log('Classes not loaded, attempting to reload...');
    try {
      importScripts(
        'bookmarkService.js',
        'aiProcessor.js',
        'categorizer.js',
        'folderManager.js'
      );
      console.log('Classes reloaded successfully');
    } catch (error) {
      console.error('Failed to reload classes:', error);
      throw new Error('Extension classes not available. Please reload the extension.');
    }
  }
}

// Handle messages from popup and options pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle async operations properly
  (async () => {
    try {
      await ensureClassesLoaded();
    } catch (error) {
      sendResponse({ success: false, error: error.message });
      return;
    }

    switch (message.action) {
      case 'startCategorization':
        await handleCategorization(message.data, sendResponse);
        break;

      case 'testApiKey':
        await handleApiKeyTest(message.data, sendResponse);
        break;

      case 'getStats':
        await handleGetStats(sendResponse);
        break;

      case 'exportBookmarks':
        await handleExportBookmarks(sendResponse);
        break;

      case 'ping':
        // Simple heartbeat check
        sendResponse({ success: true, message: 'Background script is running' });
        break;

      case 'CATEGORIZATION_ERROR':
        // Handle categorization errors from AI processor
        await handleCategorizationError(message, sendResponse);
        break;

      default:
        console.warn('Unknown message action:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
    }
  })();

  return true; // Keep message channel open for async response
});

/**
 * Handle bookmark categorization request
 */
async function handleCategorization(data, sendResponse) {
  try {
    console.log('Starting categorization process...');

    // Check if Categorizer class is available
    if (typeof Categorizer === 'undefined') {
      throw new Error('Categorizer class not loaded. Please reload the extension.');
    }
    console.log('✓ Categorizer class available');

    // Check if other required classes are available
    if (typeof BookmarkService === 'undefined') {
      throw new Error('BookmarkService class not loaded. Please reload the extension.');
    }
    if (typeof AIProcessor === 'undefined') {
      throw new Error('AIProcessor class not loaded. Please reload the extension.');
    }
    if (typeof FolderManager === 'undefined') {
      throw new Error('FolderManager class not loaded. Please reload the extension.');
    }
    console.log('✓ All required classes available');

    // Test Chrome APIs
    if (!chrome.bookmarks) {
      throw new Error('Chrome bookmarks API not available');
    }
    if (!chrome.storage) {
      throw new Error('Chrome storage API not available');
    }
    console.log('✓ Chrome APIs available');

    // Create categorizer instance
    console.log('Creating categorizer instance...');
    const categorizer = new Categorizer();
    console.log('✓ Categorizer instance created');

    // Get and validate settings
    console.log('Loading settings...');
    const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
    console.log('Settings loaded:', settings);

    if (!settings.bookmarkMindSettings) {
      throw new Error('Extension settings not found. Please configure the extension first.');
    }

    if (!settings.bookmarkMindSettings.apiKey) {
      throw new Error('API key not configured. Please set up your Gemini API key in settings.');
    }
    console.log('✓ Settings validated');

    // Initialize categorizer
    console.log('Initializing categorizer...');
    await categorizer.initialize(settings.bookmarkMindSettings);
    console.log('✓ Categorizer initialized');

    // Start categorization with progress updates
    console.log('Starting categorization process...');
    const results = await categorizer.categorizeAllBookmarks((progress) => {
      console.log('Progress update:', progress);
      // Send progress updates to popup (with better error handling)
      try {
        chrome.runtime.sendMessage({
          action: 'categorizationProgress',
          data: progress
        }).catch((error) => {
          console.log('Progress message failed (popup likely closed):', error.message);
        });
      } catch (error) {
        console.log('Progress callback error:', error.message);
      }
    }, data.forceReorganize);

    console.log('Categorization completed:', results);

    // Update last sort time and save generated categories
    const updatedSettings = {
      ...settings.bookmarkMindSettings,
      lastSortTime: Date.now(),
      lastGeneratedCategories: results.generatedCategories || []
    };
    await chrome.storage.sync.set({ bookmarkMindSettings: updatedSettings });

    sendResponse({ success: true, data: results });

  } catch (error) {
    console.error('Categorization error:', error);
    console.error('Error stack:', error.stack);
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
    // Check if AIProcessor class is available
    if (typeof AIProcessor === 'undefined') {
      throw new Error('AIProcessor class not loaded. Please reload the extension.');
    }

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

    // Check if Categorizer class is available
    if (typeof Categorizer === 'undefined') {
      throw new Error('Categorizer class not loaded. Please reload the extension.');
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
    // Check if FolderManager class is available
    if (typeof FolderManager === 'undefined') {
      throw new Error('FolderManager class not loaded. Please reload the extension.');
    }

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

/**
 * Handle categorization error notifications
 */
async function handleCategorizationError(message, sendResponse) {
  try {
    console.error('🚨 CATEGORIZATION ERROR RECEIVED:', message);

    // Log the error details
    const errorDetails = {
      message: message.message,
      batch: message.batch,
      totalBatches: message.totalBatches,
      timestamp: new Date().toISOString()
    };

    console.error('Error details:', errorDetails);

    // Forward error to popup/options page if they're listening
    try {
      chrome.runtime.sendMessage({
        type: 'CATEGORIZATION_ERROR_NOTIFICATION',
        error: errorDetails
      });
    } catch (forwardError) {
      console.log('Could not forward error to popup (likely closed):', forwardError.message);
    }

    // Store error in storage for later retrieval
    try {
      const errorLog = await chrome.storage.local.get(['categorizationErrors']) || { categorizationErrors: [] };
      errorLog.categorizationErrors = errorLog.categorizationErrors || [];
      errorLog.categorizationErrors.push(errorDetails);

      // Keep only last 10 errors
      if (errorLog.categorizationErrors.length > 10) {
        errorLog.categorizationErrors = errorLog.categorizationErrors.slice(-10);
      }

      await chrome.storage.local.set({ categorizationErrors: errorLog.categorizationErrors });
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }

    sendResponse({ success: true, message: 'Error logged' });

  } catch (error) {
    console.error('Error handling categorization error:', error);
    sendResponse({ success: false, error: error.message });
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