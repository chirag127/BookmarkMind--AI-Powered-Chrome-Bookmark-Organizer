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
    'folderManager.js',
    'learningService.js'
  );
  console.log('Background scripts loaded successfully');

  // Verify classes are available
  console.log('Available classes:', {
    BookmarkService: typeof BookmarkService !== 'undefined',
    AIProcessor: typeof AIProcessor !== 'undefined',
    Categorizer: typeof Categorizer !== 'undefined',
    FolderManager: typeof FolderManager !== 'undefined',
    LearningService: typeof LearningService !== 'undefined'
  });

} catch (error) {
  console.error('Failed to load background scripts:', error);
  console.log('Will create instances dynamically if needed');
}

// Global flag to track AI categorization state
let isAICategorizing = false;
let aiCategorizedBookmarks = new Set(); // Track bookmarks moved by AI
let aiCategorizationStartTime = null; // Track when AI categorization started

// Debug function to log AI state
function logAIState(context) {
  console.log(`🤖 AI State [${context}]:`, {
    isAICategorizing,
    aiCategorizedBookmarksCount: aiCategorizedBookmarks.size,
    startTime: aiCategorizationStartTime,
    timeSinceStart: aiCategorizationStartTime ? Date.now() - aiCategorizationStartTime : null
  });
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
      cleanupEmptyFolders: false
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

      case 'startBulkCategorization':
        await handleBulkCategorization(message.data, sendResponse);
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

      case 'getAllBookmarks':
        await handleGetAllBookmarks(sendResponse);
        break;

      case 'getAvailableCategories':
        await handleGetAvailableCategories(sendResponse);
        break;

      case 'recategorizeBookmark':
        await handleRecategorizeBookmark(message.data, sendResponse);
        break;

      case 'exportLearningData':
        await handleExportLearningData(sendResponse);
        break;

      case 'importLearningData':
        await handleImportLearningData(message.data, sendResponse);
        break;

      case 'clearLearningData':
        await handleClearLearningData(sendResponse);
        break;

      case 'getLearningStatistics':
        await handleGetLearningStatistics(sendResponse);
        break;

      case 'ping':
        // Simple heartbeat check
        sendResponse({ success: true, message: 'Background script is running' });
        break;

      case 'CATEGORIZATION_ERROR':
        // Handle categorization errors from AI processor
        await handleCategorizationError(message, sendResponse);
        break;

      case 'startAICategorization':
        // Mark AI categorization as starting
        isAICategorizing = true;
        aiCategorizedBookmarks.clear();
        aiCategorizationStartTime = Date.now();

        // AGGRESSIVE: Completely disable bookmark move listener during AI categorization
        try {
          chrome.bookmarks.onMoved.removeListener(bookmarkMoveListener);
          console.log('🤖 Bookmark move listener DISABLED during AI categorization');
        } catch (error) {
          console.warn('Failed to disable bookmark move listener:', error);
        }

        console.log('🤖 AI Categorization started - learning completely disabled');
        logAIState('START');
        sendResponse({ success: true });
        break;

      case 'endAICategorization':
        // Mark AI categorization as ended
        isAICategorizing = false;
        console.log(`🤖 AI Categorization ended - learning re-enabled. ${aiCategorizedBookmarks.size} bookmarks were moved by AI`);
        logAIState('END');

        // AGGRESSIVE: Re-enable bookmark move listener after AI categorization with delay
        setTimeout(() => {
          try {
            // Remove listener first (in case it's still there)
            chrome.bookmarks.onMoved.removeListener(bookmarkMoveListener);
            // Add it back
            chrome.bookmarks.onMoved.addListener(bookmarkMoveListener);
            console.log('🤖 Bookmark move listener RE-ENABLED after AI categorization');
          } catch (error) {
            console.warn('Failed to re-enable bookmark move listener:', error);
          }

          console.log('🤖 Clearing AI-moved bookmarks set after delay');
          aiCategorizedBookmarks.clear();
          aiCategorizationStartTime = null;
          logAIState('CLEANUP');
        }, 15000); // Increased delay to 15 seconds to ensure all AI moves are complete

        sendResponse({ success: true });
        break;

      case 'markBookmarkAsAIMoved':
        // Mark a specific bookmark as moved by AI
        if (message.bookmarkId) {
          aiCategorizedBookmarks.add(message.bookmarkId);
          console.log(`🤖 Marked bookmark ${message.bookmarkId} as AI-moved (total: ${aiCategorizedBookmarks.size})`);
          logAIState('MARK_BOOKMARK');
        }
        sendResponse({ success: true });
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
 * Handle bulk categorization request for selected bookmarks
 */
async function handleBulkCategorization(data, sendResponse) {
  try {
    console.log('Starting bulk categorization process...', data);

    // Validate input data
    if (!data.bookmarks || !Array.isArray(data.bookmarks) || data.bookmarks.length === 0) {
      throw new Error('No bookmarks provided for bulk categorization');
    }

    if (!data.selectedIds || !Array.isArray(data.selectedIds) || data.selectedIds.length === 0) {
      throw new Error('No bookmark IDs provided for bulk categorization');
    }

    console.log(`Processing ${data.bookmarks.length} selected bookmarks...`);

    // Check if required classes are available
    if (typeof Categorizer === 'undefined') {
      throw new Error('Categorizer class not loaded. Please reload the extension.');
    }
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

    // Create categorizer instance
    console.log('Creating categorizer instance...');
    const categorizer = new Categorizer();
    console.log('✓ Categorizer instance created');

    // Initialize categorizer
    console.log('Initializing categorizer...');
    await categorizer.initialize(settings.bookmarkMindSettings);
    console.log('✓ Categorizer initialized');

    // Process selected bookmarks with progress updates
    console.log('Starting bulk categorization process...');
    const results = await categorizer.categorizeBulkBookmarks(
      data.bookmarks,
      data.selectedIds,
      (progress) => {
        console.log('Bulk progress update:', progress);
        // Send progress updates to popup
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
      }
    );

    console.log('Bulk categorization completed:', results);

    // Update last sort time
    const updatedSettings = {
      ...settings.bookmarkMindSettings,
      lastSortTime: Date.now()
    };
    await chrome.storage.sync.set({ bookmarkMindSettings: updatedSettings });

    sendResponse({ success: true, data: results });

  } catch (error) {
    console.error('Bulk categorization error:', error);
    console.error('Error stack:', error.stack);
    sendResponse({
      success: false,
      error: error.message || 'Bulk categorization failed'
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
 * Handle get snapshots request
 */
async function handleGetSnapshots(sendResponse) {
  try {
    if (typeof SnapshotManager === 'undefined') {
      throw new Error('SnapshotManager class not loaded. Please reload the extension.');
    }

    const snapshotManager = new SnapshotManager();
    const snapshots = await snapshotManager.getSnapshots();
    const storageInfo = await snapshotManager.getStorageInfo();

    sendResponse({ success: true, data: { snapshots, storageInfo } });

  } catch (error) {
    console.error('Get snapshots error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to get snapshots'
    });
  }
}

/**
 * Handle restore snapshot request
 */
async function handleRestoreSnapshot(data, sendResponse) {
  try {
    if (typeof SnapshotManager === 'undefined') {
      throw new Error('SnapshotManager class not loaded. Please reload the extension.');
    }

    if (!data.snapshotId) {
      throw new Error('Snapshot ID is required');
    }

    const snapshotManager = new SnapshotManager();

    const results = await snapshotManager.restoreSnapshot(data.snapshotId, (progress) => {
      try {
        chrome.runtime.sendMessage({
          action: 'restoreProgress',
          data: progress
        }).catch(() => {});
      } catch (error) {
        console.log('Progress callback error:', error.message);
      }
    });

    sendResponse({ success: true, data: results });

  } catch (error) {
    console.error('Restore snapshot error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to restore snapshot'
    });
  }
}

/**
 * Handle delete snapshot request
 */
async function handleDeleteSnapshot(data, sendResponse) {
  try {
    if (typeof SnapshotManager === 'undefined') {
      throw new Error('SnapshotManager class not loaded. Please reload the extension.');
    }

    if (!data.snapshotId) {
      throw new Error('Snapshot ID is required');
    }

    const snapshotManager = new SnapshotManager();
    const success = await snapshotManager.deleteSnapshot(data.snapshotId);

    sendResponse({ success: success, message: 'Snapshot deleted successfully' });

  } catch (error) {
    console.error('Delete snapshot error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to delete snapshot'
    });
  }
}

/**
 * Handle analytics request
 */
async function handleGetAnalytics(sendResponse) {
  try {
    if (typeof AnalyticsService === 'undefined') {
      throw new Error('AnalyticsService class not loaded. Please reload the extension.');
    }

    const analyticsService = new AnalyticsService();
    const report = await analyticsService.getAnalyticsReport();

    sendResponse({ success: true, data: report });

  } catch (error) {
    console.error('Analytics error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to get analytics'
    });
  }
}

/**
 * Handle clear analytics request
 */
async function handleClearAnalytics(sendResponse) {
  try {
    if (typeof AnalyticsService === 'undefined') {
      throw new Error('AnalyticsService class not loaded. Please reload the extension.');
    }

    const analyticsService = new AnalyticsService();
    await analyticsService.clearAnalytics();

    sendResponse({ success: true });

  } catch (error) {
    console.error('Clear analytics error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Failed to clear analytics'
    });
  }
}

/**
 * Get all bookmarks
 */
async function handleGetAllBookmarks(sendResponse) {
  try {
    const bookmarkService = new BookmarkService();
    const bookmarks = await bookmarkService.getAllBookmarks();
    sendResponse({ success: true, data: bookmarks });
  } catch (error) {
    console.error('Error getting all bookmarks:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get available categories from folder structure
 */
async function handleGetAvailableCategories(sendResponse) {
  try {
    const tree = await chrome.bookmarks.getTree();
    const categories = new Set();

    // Extract folder paths recursively
    function extractFolders(node, path = '') {
      if (!node.url && node.id !== '0') {
        const folderPath = path ? `${path} > ${node.title}` : node.title;
        if (!['Bookmarks Bar', 'Other Bookmarks', 'Mobile Bookmarks'].includes(node.title)) {
          categories.add(folderPath);
        }

        if (node.children) {
          node.children.forEach(child => extractFolders(child, folderPath));
        }
      }
    }

    tree[0].children.forEach(root => {
      if (root.children) {
        root.children.forEach(child => extractFolders(child));
      }
    });

    const categoryList = Array.from(categories).sort();
    sendResponse({ success: true, data: categoryList });
  } catch (error) {
    console.error('Error getting categories:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle bookmark recategorization (manual user correction)
 */
async function handleRecategorizeBookmark(data, sendResponse) {
  try {
    const { bookmark, newCategory, oldCategory } = data;

    if (!bookmark || !newCategory) {
      throw new Error('Invalid recategorization data');
    }

    // Move bookmark to new category
    const bookmarkService = new BookmarkService();
    const folderId = await bookmarkService.findOrCreateFolderByPath(newCategory, '1');
    await bookmarkService.moveBookmark(bookmark.id, folderId);

    // Record correction for learning (MANUAL correction, not automatic)
    const learningService = new LearningService();
    await learningService.recordCorrection(bookmark, oldCategory, newCategory, true);

    console.log(`✅ Manual recategorization: "${bookmark.title}" from "${oldCategory}" to "${newCategory}"`);

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error recategorizing bookmark:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Export learning data
 */
async function handleExportLearningData(sendResponse) {
  try {
    const learningService = new LearningService();
    const exportData = await learningService.exportLearningData();
    sendResponse({ success: true, data: exportData });
  } catch (error) {
    console.error('Error exporting learning data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Import learning data
 */
async function handleImportLearningData(data, sendResponse) {
  try {
    const { learningData, merge } = data;
    const learningService = new LearningService();
    const result = await learningService.importLearningData(learningData, merge);
    sendResponse({ success: true, data: result });
  } catch (error) {
    console.error('Error importing learning data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Clear learning data
 */
async function handleClearLearningData(sendResponse) {
  try {
    const learningService = new LearningService();
    await learningService.clearLearningData();
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error clearing learning data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Get learning statistics
 */
async function handleGetLearningStatistics(sendResponse) {
  try {
    const learningService = new LearningService();
    const statistics = await learningService.getStatistics();
    sendResponse({ success: true, data: statistics });
  } catch (error) {
    console.error('Error getting learning statistics:', error);
    sendResponse({ success: false, error: error.message });
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
let bookmarkMoveListener = async (id, moveInfo) => {
  try {
    await handleBookmarkMove(id, moveInfo);
  } catch (error) {
    console.error('Error handling bookmark move:', error);
  }
};

chrome.bookmarks.onMoved.addListener(bookmarkMoveListener);

/**
 * Handle bookmark movement and learn from user categorizations
 */
async function handleBookmarkMove(bookmarkId, moveInfo) {
  try {
    console.log(`📚 Learning: Bookmark ${bookmarkId} moved from ${moveInfo.oldParentId} to ${moveInfo.parentId}`);
    logAIState('BOOKMARK_MOVE');

    // CRITICAL: Only learn from MANUAL user moves, never from AI categorization
    // This prevents the AI from training on its own output, which would create feedback loops

    // MULTIPLE LAYERS OF PROTECTION AGAINST AI LEARNING:

    // Layer 1: Skip learning if AI categorization is in progress
    if (isAICategorizing) {
      console.log('📚 ❌ BLOCKED: AI categorization in progress - only learning from manual user moves');
      return;
    }

    // Layer 2: Skip learning if this specific bookmark was moved by AI
    if (aiCategorizedBookmarks.has(bookmarkId)) {
      console.log(`📚 ❌ BLOCKED: Bookmark ${bookmarkId} was moved by AI - only learning from manual user moves`);
      return;
    }

    // Layer 3: Skip learning if AI categorization happened recently (timing protection)
    if (aiCategorizationStartTime && (Date.now() - aiCategorizationStartTime) < 30000) {
      console.log(`📚 ❌ BLOCKED: AI categorization happened recently (${Date.now() - aiCategorizationStartTime}ms ago) - preventing learning`);
      return;
    }

    // Layer 4: Skip learning if there are any AI-moved bookmarks still tracked
    if (aiCategorizedBookmarks.size > 0) {
      console.log(`📚 ❌ BLOCKED: ${aiCategorizedBookmarks.size} AI-moved bookmarks still tracked - preventing learning`);
      return;
    }

    // Get bookmark details
    const bookmark = await chrome.bookmarks.get(bookmarkId);
    if (!bookmark || !bookmark[0] || !bookmark[0].url) {
      console.log('📚 Skipping: Not a bookmark (folder or invalid)');
      return;
    }

    const bookmarkData = bookmark[0];

    // Get old and new folder information
    const oldFolder = await getFolderPath(moveInfo.oldParentId);
    const newFolder = await getFolderPath(moveInfo.parentId);

    console.log(`📚 Move details: "${bookmarkData.title}" from "${oldFolder}" to "${newFolder}"`);

    // Layer 5: Final safety check - if we got here during AI categorization, something is wrong
    if (isAICategorizing) {
      console.error('📚 🚨 CRITICAL ERROR: Learning function called during AI categorization despite safeguards!');
      return;
    }

    // Skip learning if moved to Bookmark Bar (user preparing for AI reorganization)
    if (moveInfo.parentId === '1') {
      console.log('📚 Skipping: Moved to Bookmark Bar (likely for AI reorganization)');
      return;
    }

    // Skip learning if moved from Bookmark Bar (AI categorization result)
    if (moveInfo.oldParentId === '1') {
      console.log('📚 Skipping: Moved from Bookmark Bar (likely AI categorization result)');
      return;
    }

    // Skip if both folders are root folders (not meaningful categorization)
    if (['1', '2', '3'].includes(moveInfo.oldParentId) && ['1', '2', '3'].includes(moveInfo.parentId)) {
      console.log('📚 Skipping: Move between root folders');
      return;
    }

    // Skip if new folder is a root folder (except Bookmark Bar which we already handled)
    if (['2', '3'].includes(moveInfo.parentId)) {
      console.log('📚 Skipping: Moved to root folder (Other Bookmarks/Mobile)');
      return;
    }

    // Extract learning patterns from the bookmark
    const patterns = extractLearningPatterns(bookmarkData, newFolder);

    if (patterns.length > 0) {
      await saveLearningPatterns(patterns, newFolder);
      console.log(`📚 ✅ MANUAL LEARNING SUCCESS: Learned ${patterns.length} patterns from USER move: ${patterns.join(', ')} → "${newFolder}"`);

      // Send notification to options page about learning
      try {
        chrome.runtime.sendMessage({
          type: 'LEARNING_DATA_UPDATED',
          count: patterns.length,
          patterns: patterns,
          category: newFolder,
          source: 'MANUAL_USER_MOVE'
        });
      } catch (error) {
        console.warn('Failed to notify about learning update:', error);
      }
    } else {
      console.log('📚 No patterns extracted from this manual move');
    }

  } catch (error) {
    console.error('Error in handleBookmarkMove:', error);
  }
}

/**
 * Get the full folder path for a folder ID
 */
async function getFolderPath(folderId) {
  try {
    if (folderId === '0') return 'Root';
    if (folderId === '1') return 'Bookmarks Bar';
    if (folderId === '2') return 'Other Bookmarks';
    if (folderId === '3') return 'Mobile Bookmarks';

    const folder = await chrome.bookmarks.get(folderId);
    if (!folder || !folder[0]) return 'Unknown';

    const folderData = folder[0];

    // Build path by traversing up the hierarchy
    const pathParts = [folderData.title];
    let currentParentId = folderData.parentId;

    while (currentParentId && !['0', '1', '2', '3'].includes(currentParentId)) {
      const parent = await chrome.bookmarks.get(currentParentId);
      if (parent && parent[0]) {
        pathParts.unshift(parent[0].title);
        currentParentId = parent[0].parentId;
      } else {
        break;
      }
    }

    return pathParts.join(' > ');
  } catch (error) {
    console.error('Error getting folder path:', error);
    return 'Unknown';
  }
}

/**
 * Extract learning patterns from bookmark data
 */
function extractLearningPatterns(bookmark, targetCategory) {
  const patterns = [];

  try {
    // Extract domain pattern
    if (bookmark.url) {
      const url = new URL(bookmark.url);
      const domain = url.hostname.replace('www.', '').toLowerCase();
      patterns.push(domain);

      // Extract subdomain if meaningful
      const domainParts = domain.split('.');
      if (domainParts.length > 2) {
        const subdomain = domainParts[0];
        if (subdomain !== 'www' && subdomain.length > 2) {
          patterns.push(subdomain);
        }
      }

      // Extract path patterns for specific services
      const path = url.pathname.toLowerCase();
      if (path.includes('gmail') || path.includes('inbox')) {
        patterns.push('gmail');
      }
      if (path.includes('github')) {
        patterns.push('github');
      }
    }

    // Extract title patterns
    if (bookmark.title) {
      const title = bookmark.title.toLowerCase();

      // Common service patterns
      const servicePatterns = [
        'gmail', 'inbox', 'email', 'mail',
        'github', 'repository', 'repo',
        'youtube', 'video',
        'netflix', 'streaming',
        'amazon', 'shopping',
        'facebook', 'twitter', 'linkedin',
        'stackoverflow', 'stack overflow',
        'documentation', 'docs', 'api'
      ];

      for (const pattern of servicePatterns) {
        if (title.includes(pattern)) {
          patterns.push(pattern);
        }
      }

      // Extract meaningful words from title (3+ characters)
      const titleWords = title.match(/\b[a-zA-Z]{3,}\b/g) || [];
      const meaningfulWords = titleWords.filter(word =>
        !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
      );

      // Add up to 3 most relevant title words
      patterns.push(...meaningfulWords.slice(0, 3));
    }

  } catch (error) {
    console.error('Error extracting patterns:', error);
  }

  // Remove duplicates and return unique patterns
  return [...new Set(patterns)].filter(pattern => pattern && pattern.length > 2);
}

/**
 * Calculate byte size of a string accounting for multi-byte UTF-8 characters
 */
function calculateByteSize(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * Save learning patterns to storage with deduplication, size validation, and auto-pruning
 */
async function saveLearningPatterns(patterns, category) {
  try {
    // Get existing learning data
    const result = await chrome.storage.sync.get(['bookmarkMindLearning']);
    const learningData = result.bookmarkMindLearning || {};

    const initialPatternCount = Object.keys(learningData).length;
    console.log(`📚 Initial pattern count: ${initialPatternCount}`);

    // Add new patterns
    let newPatternsCount = 0;
    for (const pattern of patterns) {
      if (!learningData[pattern] || learningData[pattern] !== category) {
        learningData[pattern] = category;
        newPatternsCount++;
      }
    }

    console.log(`📚 New patterns to add: ${newPatternsCount}`);

    if (newPatternsCount > 0) {
      // Step 1: Deduplication - Remove exact duplicate pattern-category pairs
      // Convert to array of entries for easier manipulation
      let learningEntries = Object.entries(learningData);
      const beforeDedup = learningEntries.length;
      
      // Remove duplicates based on pattern key (already done by object structure)
      // Additional deduplication: remove patterns that are substrings of others with same category
      const dedupedEntries = [];
      const seenPatterns = new Set();
      
      for (const [pattern, cat] of learningEntries) {
        const normalizedPattern = pattern.toLowerCase().trim();
        const key = `${normalizedPattern}:::${cat}`;
        
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          dedupedEntries.push([pattern, cat]);
        }
      }
      
      learningEntries = dedupedEntries;
      const afterDedup = learningEntries.length;
      
      if (beforeDedup !== afterDedup) {
        console.log(`📚 Deduplication: ${beforeDedup} → ${afterDedup} patterns (removed ${beforeDedup - afterDedup} duplicates)`);
      } else {
        console.log(`📚 Deduplication: No duplicates found (${afterDedup} patterns)`);
      }

      // Step 2: Size validation and auto-pruning
      const SIZE_LIMIT = 7000; // bytes
      let learningDataObj = Object.fromEntries(learningEntries);
      let jsonString = JSON.stringify(learningDataObj);
      let byteSize = calculateByteSize(jsonString);
      
      console.log(`📚 Current byte size: ${byteSize} bytes (limit: ${SIZE_LIMIT} bytes)`);

      // Step 3: Auto-prune if size exceeds limit
      if (byteSize > SIZE_LIMIT) {
        console.log(`⚠️ Size limit exceeded! Starting auto-pruning...`);
        
        // Sort entries by timestamp (oldest first) - we'll need to track timestamps
        // Since we don't have timestamps, we'll remove oldest entries by removing from the start
        // In a production scenario, we'd want to track creation time for each pattern
        
        let prunedCount = 0;
        const pruneIncrement = Math.ceil(learningEntries.length * 0.1); // Remove 10% at a time
        
        while (byteSize > SIZE_LIMIT && learningEntries.length > 0) {
          // Remove oldest patterns (from beginning of array)
          const toRemove = Math.min(pruneIncrement, learningEntries.length);
          learningEntries = learningEntries.slice(toRemove);
          prunedCount += toRemove;
          
          // Recalculate size
          learningDataObj = Object.fromEntries(learningEntries);
          jsonString = JSON.stringify(learningDataObj);
          byteSize = calculateByteSize(jsonString);
          
          console.log(`📚 Pruning iteration: removed ${toRemove} patterns, new size: ${byteSize} bytes, remaining: ${learningEntries.length} patterns`);
        }
        
        console.log(`📚 Auto-pruning complete: removed ${prunedCount} oldest patterns`);
        console.log(`📚 Final size: ${byteSize} bytes with ${learningEntries.length} patterns`);
        
        // Update learningDataObj with pruned data
        learningDataObj = Object.fromEntries(learningEntries);
      }

      // Final size check - throw error if still too large
      if (byteSize > SIZE_LIMIT) {
        const errorMsg = `Storage quota exceeded: ${byteSize} bytes > ${SIZE_LIMIT} bytes limit. Cannot save learning patterns.`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`✅ Final pattern count: ${learningEntries.length} (${byteSize} bytes)`);

      // Save updated learning data
      await chrome.storage.sync.set({ bookmarkMindLearning: learningDataObj });

      // Update timestamp
      await chrome.storage.local.set({
        learningDataLastUpdate: new Date().toISOString()
      });

      console.log(`📚 Successfully saved learning patterns to storage`);
      console.log(`📚 Summary: ${initialPatternCount} → ${learningEntries.length} patterns, ${byteSize} bytes`);

      // Notify options page if it's open
      try {
        chrome.runtime.sendMessage({
          type: 'LEARNING_DATA_UPDATED',
          patterns: patterns,
          category: category,
          count: newPatternsCount
        });
      } catch (error) {
        // Options page not open, ignore
      }
    } else {
      console.log(`📚 No new patterns to save`);
    }

  } catch (error) {
    console.error('❌ Error saving learning patterns:', error);
    throw error;
  }
}

// Cleanup on extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log('BookmarkMind extension suspending');
});

console.log('BookmarkMind background script loaded');