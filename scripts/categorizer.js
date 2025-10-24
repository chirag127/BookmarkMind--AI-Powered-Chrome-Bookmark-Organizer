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
      this.aiProcessor.setApiKey(settings.apiKey, settings.agentRouterApiKey);

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

      // Categorize bookmarks using AI with dynamic category generation
      console.log('Categorizer: Starting AI categorization with dynamic categories...');
      progressCallback?.({ stage: 'categorizing', progress: 30 });

      // Add timeout for the entire AI categorization process
      const categorizationPromise = this.aiProcessor.categorizeBookmarks(
        uncategorizedBookmarks,
        settings.categories, // Use as suggested categories
        learningData
      );

      const timeoutMinutes = Math.ceil(uncategorizedBookmarks.length / 50) * 2; // 2 minutes per batch
      const timeoutMs = Math.max(120000, timeoutMinutes * 60000); // At least 2 minutes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`AI categorization timeout after ${Math.ceil(timeoutMs / 60000)} minutes. Try with fewer bookmarks or check your internet connection.`)), timeoutMs);
      });

      console.log(`Categorizer: Processing ${uncategorizedBookmarks.length} bookmarks (estimated ${Math.ceil(uncategorizedBookmarks.length / 50)} batches, timeout: ${Math.ceil(timeoutMs / 60000)} minutes)`);

      const categorizationData = await Promise.race([categorizationPromise, timeoutPromise]);

      console.log(`Categorizer: AI categorization completed`);
      console.log(`Generated categories:`, categorizationData.categories);
      console.log(`Categorization results:`, categorizationData.results.length);

      const categorizations = categorizationData.results;
      const generatedCategories = categorizationData.categories;

      // Organize bookmarks into folders
      console.log('🚨 ABOUT TO START ORGANIZATION STEP');
      console.log(`Passing ${categorizations.length} categorizations and ${uncategorizedBookmarks.length} bookmarks to organization`);

      progressCallback?.({ stage: 'organizing', progress: 70 });
      const results = await this._organizeBookmarks(categorizations, uncategorizedBookmarks, progressCallback);

      console.log('🚨 ORGANIZATION STEP COMPLETED');
      console.log('Organization results:', results);

      progressCallback?.({ stage: 'complete', progress: 100 });

      return {
        processed: uncategorizedBookmarks.length,
        categorized: results.success,
        errors: results.errors,
        categories: results.categoriesUsed,
        generatedCategories: generatedCategories
      };

    } catch (error) {
      console.error('Categorization error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Categorize selected bookmarks in bulk
   * @param {Array} selectedBookmarks - Array of selected bookmark objects
   * @param {Array} selectedIds - Array of selected bookmark IDs
   * @param {Function} progressCallback - Progress update callback
   * @returns {Promise<Object>} Results summary
   */
  async categorizeBulkBookmarks(selectedBookmarks, selectedIds, progressCallback) {
    if (this.isProcessing) {
      throw new Error('Categorization already in progress');
    }

    this.isProcessing = true;

    try {
      console.log(`Categorizer: Starting bulk categorization of ${selectedBookmarks.length} bookmarks...`);
      progressCallback?.({ stage: 'starting', progress: 0 });

      // Get user settings
      console.log('Categorizer: Getting settings...');
      const settings = await this._getSettings();
      console.log('Categorizer: Settings loaded:', { hasApiKey: !!settings.apiKey, categories: settings.categories?.length });

      if (!settings.apiKey) {
        throw new Error('API key not configured. Please set up your Gemini API key in settings.');
      }

      console.log('Categorizer: Setting API key...');
      this.aiProcessor.setApiKey(settings.apiKey, settings.agentRouterApiKey);

      // Validate selected bookmarks exist in Chrome
      console.log('Categorizer: Validating selected bookmarks...');
      progressCallback?.({ stage: 'loading', progress: 10 });

      const validBookmarks = [];
      for (const bookmarkData of selectedBookmarks) {
        try {
          // Verify bookmark still exists
          const chromeBookmark = await chrome.bookmarks.get(bookmarkData.id);
          if (chromeBookmark && chromeBookmark[0]) {
            validBookmarks.push({
              ...bookmarkData,
              // Update with current Chrome data in case it changed
              title: chromeBookmark[0].title,
              url: chromeBookmark[0].url,
              parentId: chromeBookmark[0].parentId
            });
          }
        } catch (error) {
          console.warn(`Bookmark ${bookmarkData.id} no longer exists, skipping...`);
        }
      }

      console.log(`Validated ${validBookmarks.length} out of ${selectedBookmarks.length} selected bookmarks`);

      if (validBookmarks.length === 0) {
        return { processed: selectedBookmarks.length, categorized: 0, errors: selectedBookmarks.length, message: 'No valid bookmarks found to categorize' };
      }

      // Get learning data for better categorization
      console.log('Categorizer: Loading learning data...');
      const learningData = await this._getLearningData();
      console.log(`Categorizer: Loaded ${Object.keys(learningData).length} learning patterns`);

      // Process bookmarks in batches for better performance
      const batchSize = Math.min(settings.batchSize || 20, 50); // Limit batch size for bulk operations
      const batches = [];
      for (let i = 0; i < validBookmarks.length; i += batchSize) {
        batches.push(validBookmarks.slice(i, i + batchSize));
      }

      console.log(`Processing ${validBookmarks.length} bookmarks in ${batches.length} batches of ${batchSize}`);

      let totalCategorized = 0;
      let totalErrors = 0;
      const allCategorizations = [];
      const categoriesUsed = new Set();

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchProgress = Math.round(20 + (batchIndex / batches.length) * 60);

        progressCallback?.({
          stage: 'categorizing',
          progress: batchProgress,
          message: `Processing batch ${batchIndex + 1} of ${batches.length}...`
        });

        console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} bookmarks`);

        try {
          // Get AI categorizations for this batch
          const batchCategorizations = await this.aiProcessor.categorizeBookmarks(
            batch,
            settings,
            learningData
          );

          console.log(`Received ${batchCategorizations.length} categorizations for batch ${batchIndex + 1}`);
          allCategorizations.push(...batchCategorizations);

          // Track categories used
          batchCategorizations.forEach(cat => {
            if (cat.category && cat.category !== 'Other') {
              categoriesUsed.add(cat.category);
            }
          });

        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);
          totalErrors += batch.length;

          // Add failed categorizations as "Other"
          batch.forEach(bookmark => {
            allCategorizations.push({
              bookmarkId: bookmark.id,
              category: 'Other',
              confidence: 0,
              reasoning: 'Failed to categorize due to error'
            });
          });
        }

        // Small delay between batches to prevent API rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Bulk categorization complete. Got ${allCategorizations.length} categorizations`);

      // Organize bookmarks into folders
      progressCallback?.({ stage: 'organizing', progress: 80 });
      console.log('Categorizer: Organizing bookmarks into folders...');

      const organizationResults = await this._organizeBookmarks(
        allCategorizations,
        validBookmarks,
        (orgProgress) => {
          const adjustedProgress = Math.round(80 + (orgProgress * 0.2));
          progressCallback?.({ stage: 'organizing', progress: adjustedProgress });
        }
      );

      totalCategorized = organizationResults.success;
      totalErrors += organizationResults.errors;

      // Final results
      const results = {
        processed: selectedBookmarks.length,
        categorized: totalCategorized,
        errors: totalErrors,
        categories: organizationResults.categoriesUsed,
        generatedCategories: Array.from(organizationResults.categoriesUsed).sort()
      };

      console.log('Bulk categorization results:', results);
      progressCallback?.({ stage: 'complete', progress: 100 });

      return results;

    } catch (error) {
      console.error('Bulk categorization error:', error);
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
    console.log('🚨 === BOOKMARK ORGANIZATION STARTED ===');
    console.log('🛡️  FOLDER PROTECTION: Starting bookmark organization');
    console.log('🛡️  PROTECTION RULE: Only MOVE bookmarks TO folders, never empty existing folders');
    console.log(`📊 Organization input: ${categorizations.length} categorizations, ${bookmarks.length} bookmarks`);

    // IMMEDIATE DEBUG: Show if we even have data to work with
    if (categorizations.length === 0) {
      console.log('🚨 CRITICAL: NO CATEGORIZATIONS RECEIVED - CANNOT TRANSFER ANY BOOKMARKS!');
      return { success: 0, errors: 0, categoriesUsed: new Set() };
    }

    if (bookmarks.length === 0) {
      console.log('🚨 CRITICAL: NO BOOKMARKS RECEIVED - NOTHING TO TRANSFER!');
      return { success: 0, errors: 0, categoriesUsed: new Set() };
    }

    // DETAILED DEBUG: Show ALL categorizations
    console.log('📋 ALL CATEGORIZATIONS:');
    categorizations.forEach((cat, i) => {
      console.log(`  ${i + 1}. Bookmark ID: ${cat.bookmarkId}, Category: "${cat.category}", Confidence: ${cat.confidence}`);
    });

    // Check how many are "Other"
    const otherCount = categorizations.filter(c => c.category === 'Other').length;
    const specificCount = categorizations.length - otherCount;
    console.log(`📊 Category breakdown: ${specificCount} specific categories, ${otherCount} "Other"`);

    if (otherCount === categorizations.length) {
      console.log('🚨 CRITICAL: ALL categorizations are "Other" - NO HIERARCHICAL TRANSFERS WILL HAPPEN!');
      console.log('🚨 This means AI processing failed or timed out for all batches');
    } else {
      console.log(`✅ GOOD: ${specificCount} bookmarks have specific categories and WILL be transferred`);
    }

    const results = {
      success: 0,
      errors: 0,
      categoriesUsed: new Set()
    };

    const bookmarkMap = new Map(bookmarks.map(b => [b.id, b]));

    console.log(`🔄 Starting to process ${categorizations.length} bookmark transfers...`);

    for (let i = 0; i < categorizations.length; i++) {
      const categorization = categorizations[i];
      const bookmark = bookmarkMap.get(categorization.bookmarkId);

      console.log(`\n--- PROCESSING BOOKMARK ${i + 1}/${categorizations.length} ---`);
      console.log(`Categorization:`, categorization);
      console.log(`Bookmark found:`, bookmark ? `"${bookmark.title}"` : 'NOT FOUND');

      if (!bookmark) {
        console.error(`🚨 BOOKMARK NOT FOUND for categorization:`, categorization);
        results.errors++;
        continue;
      }

      try {
        // FORCE ALL hierarchical folders to be created in Bookmarks Bar ONLY
        const rootFolderId = '1'; // ALWAYS use Bookmarks Bar for hierarchical organization

        console.log(`📁 Creating hierarchical folder in Bookmarks Bar: "${categorization.category}"`);

        // Get current folder name before moving
        let currentFolderName = 'Unknown';
        try {
          if (bookmark.parentId) {
            const currentParent = await chrome.bookmarks.get(bookmark.parentId);
            currentFolderName = currentParent[0].title;
          }
        } catch (error) {
          currentFolderName = `ID:${bookmark.parentId}`;
        }

        // Find or create folder for category in Bookmarks Bar ONLY (including "Other")
        const folderId = await this.bookmarkService.findOrCreateFolderByPath(categorization.category, rootFolderId);

        // Get destination folder name
        let destinationFolderName = 'Unknown';
        try {
          const destinationFolder = await chrome.bookmarks.get(folderId);
          destinationFolderName = destinationFolder[0].title;
        } catch (error) {
          destinationFolderName = `ID:${folderId}`;
        }

        // Detailed logging of bookmark transfer
        console.log(`📋 BOOKMARK TRANSFER:`);
        console.log(`   📖 Bookmark: "${bookmark.title}"`);
        console.log(`   📂 FROM: "${currentFolderName}" (ID: ${bookmark.parentId})`);
        console.log(`   📁 TO: "${destinationFolderName}" (ID: ${folderId})`);
        console.log(`   🎯 Category: "${categorization.category}"`);
        console.log(`   🔗 URL: ${bookmark.url?.substring(0, 60)}...`);

        // Move bookmark to folder (PROTECTION: Only moving TO folders, not emptying)
        await this.bookmarkService.moveBookmark(bookmark.id, folderId);

        console.log(`   ✅ TRANSFER COMPLETE: "${bookmark.title}" successfully moved from "${currentFolderName}" to "${destinationFolderName}"`);

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

    // Summary of all bookmark transfers
    console.log(`\n📊 BOOKMARK TRANSFER SUMMARY:`);
    console.log(`   ✅ Successful transfers: ${results.success}`);
    console.log(`   ❌ Failed transfers: ${results.errors}`);
    console.log(`   📁 Categories used: ${results.categoriesUsed.size}`);
    console.log(`   📂 Categories: ${Array.from(results.categoriesUsed).join(', ')}`);
    console.log(`🎉 Organization complete: ${results.success} bookmarks successfully transferred to hierarchical folders!`);

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