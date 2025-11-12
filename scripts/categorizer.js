/**
 * BookmarkMind - Categorizer
 * Main orchestrator for bookmark categorization process
 */

class Categorizer {
  constructor() {
    this.bookmarkService = new BookmarkService();
    this.aiProcessor = new AIProcessor();
    this.folderManager = new FolderManager();
    this.learningService = typeof LearningService !== 'undefined' ? new LearningService() : null;
    this.snapshotManager = typeof SnapshotManager !== 'undefined' ? new SnapshotManager() : null;
    this.analyticsService = typeof AnalyticsService !== 'undefined' ? new AnalyticsService() : null;
    this.isProcessing = false;
    this.sessionStartTime = null;
  }

  /**
   * Initialize categorizer with settings
   * @param {Object} settings - User settings
   */
  async initialize(settings) {
    if (settings.apiKey) {
      this.aiProcessor.setApiKey(settings.apiKey, settings.cerebrasApiKey || null, settings.groqApiKey || null);
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
    this.sessionStartTime = Date.now();

    try {
      console.log('Categorizer: Starting categorization...');
      progressCallback?.({ stage: 'starting', progress: 0 });

      // Create snapshot before starting categorization
      if (this.snapshotManager) {
        try {
          progressCallback?.({ stage: 'snapshot', progress: 5, message: 'Creating backup snapshot...' });
          const bookmarks = await this.bookmarkService.getAllBookmarks();
          await this.snapshotManager.createSnapshot(
            forceReorganize ? 'Before Force Reorganization' : 'Before AI Categorization',
            {
              operationType: forceReorganize ? 'force_reorganize' : 'categorization',
              bookmarkCount: bookmarks.length,
              uncategorizedCount: bookmarks.filter(b => ['1', '2', '3'].includes(b.parentId)).length
            }
          );
          console.log('✅ Snapshot created successfully');
        } catch (snapshotError) {
          console.warn('Failed to create snapshot, continuing anyway:', snapshotError);
        }
      }

      // Get user settings
      console.log('Categorizer: Getting settings...');
      const settings = await this._getSettings();
      console.log('Categorizer: Settings loaded:', { hasApiKey: !!settings.apiKey, categories: settings.categories?.length });

      if (!settings.apiKey) {
        throw new Error('API key not configured. Please set up your Gemini API key in settings.');
      }

      console.log('Categorizer: Setting API keys...');
      this.aiProcessor.setApiKey(settings.apiKey, settings.cerebrasApiKey || null, settings.groqApiKey || null);

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

      // Calculate estimated processing time based on batch size
      const batchSize = settings.batchSize || 50;
      const estimatedBatches = Math.ceil(uncategorizedBookmarks.length / batchSize);
      const estimatedMinutes = Math.ceil(estimatedBatches * 0.5);

      console.log(`Processing ${uncategorizedBookmarks.length} bookmarks in ${estimatedBatches} batches (batch size: ${batchSize})`);
      console.log(`Estimated time: ${estimatedMinutes} minutes`);

      if (uncategorizedBookmarks.length > 500) {
        console.log(`Large collection detected: ${uncategorizedBookmarks.length} bookmarks will be processed in batches.`);
      }

      // Get learning data
      const learningData = await this._getLearningData();

      // Categorize bookmarks using AI with dynamic category generation and batch progress tracking
      console.log('Categorizer: Starting AI categorization with dynamic categories...');
      progressCallback?.({ stage: 'categorizing', progress: 30, message: `Processing ${uncategorizedBookmarks.length} bookmarks in batches...` });

      // Process bookmarks in batches with progress tracking
      const totalBatches = Math.ceil(uncategorizedBookmarks.length / batchSize);
      
      console.log(`Categorizer: Processing ${uncategorizedBookmarks.length} bookmarks in ${totalBatches} batches of ${batchSize}`);

      // Create a progress-aware categorization wrapper
      const categorizationPromise = this._categorizeWithProgress(
        uncategorizedBookmarks,
        settings.categories,
        learningData,
        batchSize,
        (batchProgress) => {
          // Map batch progress (0-100) to categorization stage (30-70)
          const overallProgress = 30 + Math.floor(batchProgress * 0.4);
          progressCallback?.({ 
            stage: 'categorizing', 
            progress: overallProgress,
            message: `Processing batch ${batchProgress.currentBatch}/${batchProgress.totalBatches}...`
          });
        }
      );

      // Dynamic timeout based on actual batch count (3 minutes per batch minimum)
      const timeoutMinutes = Math.max(5, totalBatches * 3);
      const timeoutMs = timeoutMinutes * 60000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`AI categorization timeout after ${timeoutMinutes} minutes. Check your internet connection or reduce batch size.`)), timeoutMs);
      });

      console.log(`Categorizer: Timeout set to ${timeoutMinutes} minutes for ${totalBatches} batches`);

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

      const finalResults = {
        processed: uncategorizedBookmarks.length,
        categorized: results.success,
        errors: results.errors,
        categories: results.categoriesUsed,
        generatedCategories: generatedCategories
      };

      // Record analytics
      if (this.analyticsService) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        await this.analyticsService.recordCategorizationSession({
          processed: finalResults.processed,
          categorized: finalResults.categorized,
          errors: finalResults.errors,
          duration: sessionDuration,
          categories: Array.from(results.categoriesUsed),
          mode: 'full'
        });
      }

      return finalResults;

    } catch (error) {
      console.error('Categorization error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.sessionStartTime = null;
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
    this.sessionStartTime = Date.now();

    try {
      console.log(`Categorizer: Starting bulk categorization of ${selectedBookmarks.length} bookmarks...`);
      progressCallback?.({ stage: 'starting', progress: 0 });

      // Create snapshot before starting bulk categorization
      if (this.snapshotManager) {
        try {
          progressCallback?.({ stage: 'snapshot', progress: 5, message: 'Creating backup snapshot...' });
          await this.snapshotManager.createSnapshot(
            'Before Bulk Categorization',
            {
              operationType: 'bulk_categorization',
              bookmarkCount: selectedBookmarks.length,
              selectedIds: selectedIds
            }
          );
          console.log('✅ Snapshot created successfully');
        } catch (snapshotError) {
          console.warn('Failed to create snapshot, continuing anyway:', snapshotError);
        }
      }

      // Get user settings
      console.log('Categorizer: Getting settings...');
      const settings = await this._getSettings();
      console.log('Categorizer: Settings loaded:', { hasApiKey: !!settings.apiKey, categories: settings.categories?.length });

      if (!settings.apiKey) {
        throw new Error('API key not configured. Please set up your Gemini API key in settings.');
      }

      console.log('Categorizer: Setting API keys...');
      this.aiProcessor.setApiKey(settings.apiKey, settings.cerebrasApiKey || null, settings.groqApiKey || null);

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

      // Use the same batch processing approach with progress tracking
      console.log(`Bulk categorization: Processing ${validBookmarks.length} bookmarks with batch size ${settings.batchSize || 50}`);

      progressCallback?.({
        stage: 'categorizing',
        progress: 20,
        message: `Processing ${validBookmarks.length} bookmarks in batches...`
      });

      // Use aiProcessor's categorizeBookmarks which handles batching internally
      const categorizationData = await this.aiProcessor.categorizeBookmarks(
        validBookmarks,
        settings.categories,
        learningData,
        (batchNum, totalBatches) => {
          const batchProgress = Math.round(20 + ((batchNum / totalBatches) * 60));
          progressCallback?.({
            stage: 'categorizing',
            progress: batchProgress,
            message: `Processing batch ${batchNum} of ${totalBatches}...`
          });
        }
      );

      const allCategorizations = categorizationData.results || [];
      console.log(`Bulk categorization complete. Got ${allCategorizations.length} categorizations`);

      // Track categories used
      const categoriesUsed = new Set();
      allCategorizations.forEach(cat => {
        if (cat.category && cat.category !== 'Other') {
          categoriesUsed.add(cat.category);
        }
      });

      let totalErrors = 0;

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

      // Record analytics
      if (this.analyticsService) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        await this.analyticsService.recordCategorizationSession({
          processed: results.processed,
          categorized: results.categorized,
          errors: results.errors,
          duration: sessionDuration,
          categories: results.generatedCategories,
          mode: 'bulk'
        });
      }

      return results;

    } catch (error) {
      console.error('Bulk categorization error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.sessionStartTime = null;
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
      if (!this.learningService) {
        this.learningService = new LearningService();
      }
      await this.learningService.recordCorrection(bookmarkData, originalCategory, correctedCategory, true);
      console.log(`Recorded correction: ${originalCategory} → ${correctedCategory} for "${bookmarkData.title}"`);

    } catch (error) {
      console.error('Error recording correction:', error);
    }
  }

  /**
   * Categorize bookmarks with progress tracking across batches
   * @param {Array} bookmarks - All bookmarks to categorize
   * @param {Array} suggestedCategories - Suggested categories
   * @param {Object} learningData - Learning data
   * @param {number} batchSize - Size of each batch
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Object>} Categorization results
   */
  async _categorizeWithProgress(bookmarks, suggestedCategories, learningData, batchSize, progressCallback) {
    const totalBatches = Math.ceil(bookmarks.length / batchSize);
    console.log(`Processing ${bookmarks.length} bookmarks in ${totalBatches} batches of ${batchSize}`);

    let currentBatch = 0;

    // Call the aiProcessor's categorizeBookmarks method which handles batching internally
    // but wrap it to provide progress updates
    const results = await this.aiProcessor.categorizeBookmarks(
      bookmarks,
      suggestedCategories,
      learningData,
      (batchNum, total) => {
        currentBatch = batchNum;
        const batchProgress = Math.floor((batchNum / total) * 100);
        progressCallback?.({
          currentBatch: batchNum,
          totalBatches: total,
          progress: batchProgress
        });
      }
    );

    return results;
  }

  /**
   * Get user settings
   * @returns {Promise<Object>} User settings
   */
  async _getSettings() {
    const defaultSettings = {
      apiKey: '',
      categories: ['Work', 'Personal', 'Shopping', 'Entertainment', 'News', 'Social', 'Learning', 'Other'],
      lastSortTime: 0,
      batchSize: 50
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
      if (!this.learningService) {
        this.learningService = new LearningService();
      }
      return await this.learningService.getLearningData();
    } catch (error) {
      console.error('Error getting learning data:', error);
      return {
        version: '1.0',
        patterns: {},
        corrections: [],
        lastUpdated: null
      };
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