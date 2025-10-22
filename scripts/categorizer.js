/**
 * BookmarkMind - Categorizer
 * Main orchestrator for bookmark categorization process
 */

class Categorizer {
  constructor() {
    this.bookmarkService = new BookmarkService();
    this.aiProcessor = new AIProcessor();
    this.folderManager = new FolderManager();
    this.isProcessing = false;
  }

  /**
   * Initialize categorizer with settings
   * @param {Object} settings - User settings
   */
  async initialize(settings) {
    if (settings.apiKey) {
      this.aiProcessor.setApiKey(settings.apiKey);
    }
  }

  /**
   * Main categorization process
   * @param {Function} progressCallback - Progress update callback
   * @param {boolean} forceReorganize - Whether to reorganize all bookmarks
   * @returns {Promise<Object>} Results summary
   */
  async categorizeAllBookmarks(progressCallback, forceReorganize = false) {
    if (this.isProcessing) {
      throw new Error('Categorization already in progress');
    }

    this.isProcessing = true;

    try {
      console.log('Categorizer: Starting categorization...');
      progressCallback?.({ stage: 'starting', progress: 0 });

      // Get user settings
      console.log('Categorizer: Getting settings...');
      const settings = await this._getSettings();
      console.log('Categorizer: Settings loaded:', { hasApiKey: !!settings.apiKey, categories: settings.categories?.length });

      if (!settings.apiKey) {
        throw new Error('API key not configured. Please set up your Gemini API key in settings.');
      }

      console.log('Categorizer: Setting API key...');
      this.aiProcessor.setApiKey(settings.apiKey);

      // Get all bookmarks
      console.log('Categorizer: Loading bookmarks...');
      progressCallback?.({ stage: 'loading', progress: 10 });
      const bookmarks = await this.bookmarkService.getAllBookmarks();
      console.log(`Categorizer: Loaded ${bookmarks.length} bookmarks`);

      if (bookmarks.length === 0) {
        console.log('Categorizer: No bookmarks found');
        return { processed: 0, categorized: 0, errors: 0 };
      }

      // Filter bookmarks that need categorization
      // Check if user wants to force re-organization

      let uncategorizedBookmarks;

      if (forceReorganize) {
        // Re-organize ALL bookmarks, including those already in folders
        uncategorizedBookmarks = bookmarks;
        console.log('Force re-organize mode: Processing ALL bookmarks');
      } else {
        // Only process bookmarks in main folders (not in subfolders)
        uncategorizedBookmarks = bookmarks.filter(bookmark => {
          const isInMainFolders = ['1', '2', '3'].includes(bookmark.parentId);
          const isInRootLevel = bookmark.currentFolderName &&
            ['Bookmarks Bar', 'Other Bookmarks', 'Mobile Bookmarks'].includes(bookmark.currentFolderName);

          return isInMainFolders || isInRootLevel;
        });
      }

      console.log(`Found ${uncategorizedBookmarks.length} bookmarks to process out of ${bookmarks.length} total`);
      console.log('Bookmark distribution:', {
        bookmarksBar: uncategorizedBookmarks.filter(b => b.parentId === '1').length,
        otherBookmarks: uncategorizedBookmarks.filter(b => b.parentId === '2').length,
        mobileBookmarks: uncategorizedBookmarks.filter(b => b.parentId === '3').length
      });

      if (uncategorizedBookmarks.length === 0) {
        return { processed: bookmarks.length, categorized: 0, errors: 0, message: 'All bookmarks are already organized!' };
      }

      // For large collections, warn user and potentially limit processing
      if (uncategorizedBookmarks.length > 500) {
        console.warn(`Large collection detected: ${uncategorizedBookmarks.length} bookmarks. This may take 10+ minutes.`);

        // Optionally limit to first 500 bookmarks for testing
        if (uncategorizedBookmarks.length > 1000) {
          console.log('Limiting to first 500 bookmarks to prevent timeout. Use smaller batches for full processing.');
          uncategorizedBookmarks = uncategorizedBookmarks.slice(0, 500);
        }
      }

      // Get learning data
      const learningData = await this._getLearningData();

      // Categorize bookmarks using AI
      console.log('Categorizer: Starting AI categorization...');
      progressCallback?.({ stage: 'categorizing', progress: 30 });

      // Add timeout for the entire AI categorization process
      const categorizationPromise = this.aiProcessor.categorizeBookmarks(
        uncategorizedBookmarks,
        settings.categories,
        learningData
      );

      const timeoutMinutes = Math.ceil(uncategorizedBookmarks.length / 50) * 2; // 2 minutes per batch
      const timeoutMs = Math.max(120000, timeoutMinutes * 60000); // At least 2 minutes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`AI categorization timeout after ${Math.ceil(timeoutMs / 60000)} minutes. Try with fewer bookmarks or check your internet connection.`)), timeoutMs);
      });

      console.log(`Categorizer: Processing ${uncategorizedBookmarks.length} bookmarks (estimated ${Math.ceil(uncategorizedBookmarks.length / 50)} batches, timeout: ${Math.ceil(timeoutMs / 60000)} minutes)`);

      const categorizations = await Promise.race([categorizationPromise, timeoutPromise]);

      console.log(`Categorizer: AI categorization completed, got ${categorizations.length} results`);

      // Organize bookmarks into folders
      progressCallback?.({ stage: 'organizing', progress: 70 });
      const results = await this._organizeBookmarks(categorizations, uncategorizedBookmarks, progressCallback);

      progressCallback?.({ stage: 'complete', progress: 100 });

      return {
        processed: uncategorizedBookmarks.length,
        categorized: results.success,
        errors: results.errors,
        categories: results.categoriesUsed
      };

    } catch (error) {
      console.error('Categorization error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Organize bookmarks into folders based on categorization results
   * @param {Array} categorizations - AI categorization results
   * @param {Array} bookmarks - Original bookmarks
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Object>} Organization results
   */
  async _organizeBookmarks(categorizations, bookmarks, progressCallback) {
    const results = {
      success: 0,
      errors: 0,
      categoriesUsed: new Set()
    };

    const bookmarkMap = new Map(bookmarks.map(b => [b.id, b]));

    for (let i = 0; i < categorizations.length; i++) {
      const categorization = categorizations[i];
      const bookmark = bookmarkMap.get(categorization.bookmarkId);

      if (!bookmark) {
        console.warn(`Bookmark not found for categorization:`, categorization);
        results.errors++;
        continue;
      }

      try {
        // Determine the appropriate root folder for organization
        // Prefer Bookmarks Bar, but use original location if it's Other/Mobile bookmarks
        let rootFolderId = '1'; // Default to Bookmarks Bar

        if (bookmark.parentId === '2') {
          rootFolderId = '2'; // Keep in Other Bookmarks
        } else if (bookmark.parentId === '3') {
          rootFolderId = '3'; // Keep in Mobile Bookmarks
        }

        // Find or create folder for category in the appropriate root
        const folderId = await this.bookmarkService.findOrCreateFolderByPath(categorization.category, rootFolderId);

        // Move bookmark to folder
        await this.bookmarkService.moveBookmark(bookmark.id, folderId);

        results.success++;
        results.categoriesUsed.add(categorization.category);

        // Update progress
        const progress = 70 + Math.floor((i / categorizations.length) * 25);
        progressCallback?.({ stage: 'organizing', progress });

      } catch (error) {
        console.error(`Error organizing bookmark ${bookmark.title}:`, error);
        results.errors++;
      }
    }

    return results;
  }

  /**
   * Record user correction for learning
   * @param {string} bookmarkId - Bookmark ID
   * @param {string} originalCategory - AI-assigned category
   * @param {string} correctedCategory - User-corrected category
   */
  async recordCorrection(bookmarkId, originalCategory, correctedCategory) {
    try {
      const bookmark = await chrome.bookmarks.get(bookmarkId);
      if (!bookmark || !bookmark[0]) return;

      const bookmarkData = bookmark[0];
      const learningData = await this._getLearningData();

      // Extract patterns from URL and title
      const url = new URL(bookmarkData.url);
      const domain = url.hostname.replace('www.', '');
      const title = bookmarkData.title.toLowerCase();

      // Store learning patterns
      learningData[domain] = correctedCategory;

      // Store title keywords (if title has meaningful words)
      const titleWords = title.split(/\s+/).filter(word => word.length > 3);
      titleWords.forEach(word => {
        learningData[word] = correctedCategory;
      });

      await this._saveLearningData(learningData);
      console.log(`Recorded correction: ${originalCategory} → ${correctedCategory} for ${domain}`);

    } catch (error) {
      console.error('Error recording correction:', error);
    }
  }

  /**
   * Get user settings
   * @returns {Promise<Object>} User settings
   */
  async _getSettings() {
    const defaultSettings = {
      apiKey: '',
      categories: ['Work', 'Personal', 'Shopping', 'Entertainment', 'News', 'Social', 'Learning', 'Other'],
      lastSortTime: 0
    };

    try {
      const result = await chrome.storage.sync.get(['bookmarkMindSettings']);
      return { ...defaultSettings, ...result.bookmarkMindSettings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  }

  /**
   * Get learning data
   * @returns {Promise<Object>} Learning data
   */
  async _getLearningData() {
    try {
      const result = await chrome.storage.sync.get(['bookmarkMindLearning']);
      return result.bookmarkMindLearning || {};
    } catch (error) {
      console.error('Error getting learning data:', error);
      return {};
    }
  }

  /**
   * Save learning data
   * @param {Object} learningData - Learning data to save
   */
  async _saveLearningData(learningData) {
    try {
      await chrome.storage.sync.set({ bookmarkMindLearning: learningData });
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  }

  /**
   * Get categorization statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    try {
      const bookmarkStats = await this.bookmarkService.getBookmarkStats();
      const settings = await this._getSettings();
      const learningData = await this._getLearningData();

      return {
        ...bookmarkStats,
        lastSortTime: settings.lastSortTime,
        learningPatterns: Object.keys(learningData).length,
        categories: settings.categories.length
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Categorizer = Categorizer;
}

// For service worker context (global scope)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.Categorizer = Categorizer;
}