/**
 * BookmarkMind - Redirect Resolver Service
 * Resolves bookmark URLs to their final destinations by following redirects
 * Implements batch processing, caching, retry logic, and detailed logging
 */

class RedirectResolver {
  constructor() {
    this.CACHE_KEY = 'redirectResolver_cache';
    this.STATS_KEY = 'redirectResolver_stats';
    this.CONCURRENT_LIMIT = 20;
    this.REQUEST_TIMEOUT = 10000; // 10 seconds
    this.MAX_RETRIES = 3;
    this.CACHE_EXPIRY_DAYS = 30;
    
    // Statistics tracking
    this.stats = {
      resolved: 0,
      failed: 0,
      unchanged: 0,
      cached: 0,
      updated: 0
    };
  }

  /**
   * Resolve a single bookmark URL to its final destination
   * @param {string} url - URL to resolve
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Result object with original, final, chain, and success
   */
  async resolveUrl(url, retryCount = 0) {
    try {
      // Check cache first
      const cachedResult = await this._getCachedUrl(url);
      if (cachedResult) {
        console.log(`📦 Cache hit for: ${url}`);
        console.log(`   └─ Cached final URL: ${cachedResult.finalUrl}`);
        this.stats.cached++;
        return {
          originalUrl: url,
          finalUrl: cachedResult.finalUrl,
          chain: cachedResult.chain,
          success: true,
          cached: true
        };
      }

      console.log(`🔍 Resolving URL (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1}): ${url}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      try {
        // Use fetch with HEAD request and redirect: 'follow' mode
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        clearTimeout(timeoutId);

        const finalUrl = response.url;
        
        // Build redirect chain (we can only see the final URL in fetch API)
        const chain = [url];
        if (finalUrl !== url) {
          chain.push(finalUrl);
        }

        console.log(`✅ Successfully resolved: ${url}`);
        console.log(`   ├─ Original URL: ${url}`);
        console.log(`   ├─ Final URL: ${finalUrl}`);
        console.log(`   └─ Redirect chain: ${chain.join(' → ')}`);

        const result = {
          originalUrl: url,
          finalUrl: finalUrl,
          chain: chain,
          success: true,
          cached: false
        };

        // Cache the result
        await this._cacheUrl(url, result);

        return result;

      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle timeout or network errors with retry logic
        if (retryCount < this.MAX_RETRIES) {
          console.warn(`⚠️ Fetch failed for ${url}, retrying... (${fetchError.message})`);
          await this._delay(1000 * (retryCount + 1)); // Exponential backoff
          return this.resolveUrl(url, retryCount + 1);
        }

        throw fetchError;
      }

    } catch (error) {
      console.error(`❌ Failed to resolve URL after ${retryCount + 1} attempts: ${url}`);
      console.error(`   └─ Error: ${error.message}`);

      return {
        originalUrl: url,
        finalUrl: url,
        chain: [url],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve multiple URLs with concurrent batch processing
   * @param {Array<string>} urls - Array of URLs to resolve
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Array>} Array of resolution results
   */
  async resolveUrls(urls, progressCallback = null) {
    console.log(`\n🚀 Starting batch URL resolution for ${urls.length} URLs`);
    console.log(`   ├─ Concurrent limit: ${this.CONCURRENT_LIMIT}`);
    console.log(`   ├─ Timeout per request: ${this.REQUEST_TIMEOUT}ms`);
    console.log(`   └─ Max retries: ${this.MAX_RETRIES}`);

    const results = [];
    const total = urls.length;
    let completed = 0;

    // Process URLs in concurrent batches
    for (let i = 0; i < urls.length; i += this.CONCURRENT_LIMIT) {
      const batch = urls.slice(i, i + this.CONCURRENT_LIMIT);
      const batchNumber = Math.floor(i / this.CONCURRENT_LIMIT) + 1;
      const totalBatches = Math.ceil(urls.length / this.CONCURRENT_LIMIT);

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} URLs)`);

      // Process batch concurrently
      const batchPromises = batch.map(url => this.resolveUrl(url));
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);
      completed += batch.length;

      // Update progress
      if (progressCallback) {
        progressCallback({
          completed,
          total,
          percentage: Math.round((completed / total) * 100)
        });
      }

      console.log(`✅ Batch ${batchNumber} complete: ${completed}/${total} URLs processed`);
    }

    // Update statistics
    this.stats.resolved = results.filter(r => r.success && r.finalUrl !== r.originalUrl).length;
    this.stats.failed = results.filter(r => !r.success).length;
    this.stats.unchanged = results.filter(r => r.success && r.finalUrl === r.originalUrl).length;

    console.log(`\n📊 Batch Resolution Summary:`);
    console.log(`   ├─ Total URLs: ${total}`);
    console.log(`   ├─ Resolved (changed): ${this.stats.resolved}`);
    console.log(`   ├─ Unchanged: ${this.stats.unchanged}`);
    console.log(`   ├─ Failed: ${this.stats.failed}`);
    console.log(`   └─ Cache hits: ${this.stats.cached}`);

    return results;
  }

  /**
   * Process a single bookmark - resolve and update if needed
   * @param {Object} bookmark - Bookmark object with id, url, title
   * @returns {Promise<Object>} Result with bookmark info and resolution status
   */
  async processBookmark(bookmark) {
    console.log(`\n🔖 Processing bookmark: "${bookmark.title}"`);
    console.log(`   └─ URL: ${bookmark.url}`);

    const resolution = await this.resolveUrl(bookmark.url);

    const result = {
      bookmarkId: bookmark.id,
      title: bookmark.title,
      originalUrl: resolution.originalUrl,
      finalUrl: resolution.finalUrl,
      chain: resolution.chain,
      updated: false,
      success: resolution.success
    };

    // Update bookmark if URL changed
    if (resolution.success && resolution.finalUrl !== resolution.originalUrl) {
      try {
        await chrome.bookmarks.update(bookmark.id, { url: resolution.finalUrl });
        result.updated = true;
        this.stats.updated++;

        console.log(`✅ Bookmark updated successfully`);
        console.log(`   ├─ Original URL: ${resolution.originalUrl}`);
        console.log(`   ├─ Final URL: ${resolution.finalUrl}`);
        console.log(`   ├─ Redirect chain: ${resolution.chain.join(' → ')}`);
        console.log(`   └─ Title preserved: "${bookmark.title}"`);

      } catch (error) {
        console.error(`❌ Failed to update bookmark: ${error.message}`);
        result.error = error.message;
      }
    } else if (resolution.success) {
      console.log(`ℹ️ No update needed - URL unchanged`);
    } else {
      console.log(`❌ Resolution failed - bookmark not updated`);
    }

    return result;
  }

  /**
   * Process multiple bookmarks - resolve and update as needed
   * @param {Array<Object>} bookmarks - Array of bookmark objects
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} Summary statistics and detailed results
   */
  async processBookmarks(bookmarks, progressCallback = null) {
    console.log(`\n🚀 ========================================`);
    console.log(`📚 Starting Bookmark Redirect Resolution`);
    console.log(`🚀 ========================================`);
    console.log(`Total bookmarks to process: ${bookmarks.length}`);

    // Reset statistics
    this.stats = {
      resolved: 0,
      failed: 0,
      unchanged: 0,
      cached: 0,
      updated: 0
    };

    const results = [];
    const total = bookmarks.length;
    let completed = 0;

    // Process bookmarks in concurrent batches
    for (let i = 0; i < bookmarks.length; i += this.CONCURRENT_LIMIT) {
      const batch = bookmarks.slice(i, i + this.CONCURRENT_LIMIT);
      const batchNumber = Math.floor(i / this.CONCURRENT_LIMIT) + 1;
      const totalBatches = Math.ceil(bookmarks.length / this.CONCURRENT_LIMIT);

      console.log(`\n📦 ======================================`);
      console.log(`📦 Batch ${batchNumber}/${totalBatches}`);
      console.log(`📦 ======================================`);
      console.log(`Processing ${batch.length} bookmarks concurrently...`);

      // Process batch concurrently
      const batchPromises = batch.map(bookmark => this.processBookmark(bookmark));
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);
      completed += batch.length;

      // Update progress
      if (progressCallback) {
        progressCallback({
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
          stats: { ...this.stats }
        });
      }

      console.log(`\n✅ Batch ${batchNumber} complete: ${completed}/${total} bookmarks processed`);
    }

    // Calculate final statistics
    const summary = {
      total: total,
      processed: completed,
      updated: this.stats.updated,
      resolved: results.filter(r => r.success && r.finalUrl !== r.originalUrl).length,
      unchanged: results.filter(r => r.success && r.finalUrl === r.originalUrl).length,
      failed: results.filter(r => !r.success).length,
      cached: this.stats.cached,
      results: results
    };

    console.log(`\n📊 ========================================`);
    console.log(`📊 FINAL SUMMARY`);
    console.log(`📊 ========================================`);
    console.log(`Total bookmarks: ${summary.total}`);
    console.log(`Successfully resolved (changed): ${summary.resolved}`);
    console.log(`Unchanged: ${summary.unchanged}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Cache hits: ${summary.cached}`);
    console.log(`Bookmarks updated: ${summary.updated}`);
    console.log(`📊 ========================================\n`);

    // Save statistics to storage
    await this._saveStats(summary);

    return summary;
  }

  /**
   * Get cached URL resolution if available and not expired
   * @param {string} url - URL to check
   * @returns {Promise<Object|null>} Cached result or null
   */
  async _getCachedUrl(url) {
    try {
      const cache = await chrome.storage.local.get(this.CACHE_KEY);
      const cacheData = cache[this.CACHE_KEY] || {};

      if (cacheData[url]) {
        const cached = cacheData[url];
        const ageInDays = (Date.now() - cached.timestamp) / (1000 * 60 * 60 * 24);

        // Check if cache entry is still valid
        if (ageInDays < this.CACHE_EXPIRY_DAYS) {
          return {
            finalUrl: cached.finalUrl,
            chain: cached.chain
          };
        } else {
          console.log(`🗑️ Cache expired for: ${url} (${Math.round(ageInDays)} days old)`);
          // Remove expired entry
          delete cacheData[url];
          await chrome.storage.local.set({ [this.CACHE_KEY]: cacheData });
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache URL resolution result
   * @param {string} url - Original URL
   * @param {Object} result - Resolution result
   */
  async _cacheUrl(url, result) {
    try {
      const cache = await chrome.storage.local.get(this.CACHE_KEY);
      const cacheData = cache[this.CACHE_KEY] || {};

      cacheData[url] = {
        finalUrl: result.finalUrl,
        chain: result.chain,
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ [this.CACHE_KEY]: cacheData });
      console.log(`💾 Cached result for: ${url}`);

    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  /**
   * Save statistics to storage
   * @param {Object} stats - Statistics object
   */
  async _saveStats(stats) {
    try {
      await chrome.storage.local.set({
        [this.STATS_KEY]: {
          ...stats,
          timestamp: Date.now()
        }
      });
      console.log('💾 Statistics saved to storage');
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }

  /**
   * Get saved statistics from storage
   * @returns {Promise<Object|null>} Statistics object or null
   */
  async getStats() {
    try {
      const result = await chrome.storage.local.get(this.STATS_KEY);
      return result[this.STATS_KEY] || null;
    } catch (error) {
      console.error('Error reading statistics:', error);
      return null;
    }
  }

  /**
   * Clear cache
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      await chrome.storage.local.remove(this.CACHE_KEY);
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache size and info
   * @returns {Promise<Object>} Cache info
   */
  async getCacheInfo() {
    try {
      const cache = await chrome.storage.local.get(this.CACHE_KEY);
      const cacheData = cache[this.CACHE_KEY] || {};
      const entries = Object.keys(cacheData);

      // Count expired entries
      const now = Date.now();
      const expiryMs = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const expired = entries.filter(url => {
        return (now - cacheData[url].timestamp) > expiryMs;
      }).length;

      return {
        totalEntries: entries.length,
        validEntries: entries.length - expired,
        expiredEntries: expired,
        expiryDays: this.CACHE_EXPIRY_DAYS
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        expiryDays: this.CACHE_EXPIRY_DAYS
      };
    }
  }

  /**
   * Clean expired cache entries
   * @returns {Promise<number>} Number of entries removed
   */
  async cleanExpiredCache() {
    try {
      const cache = await chrome.storage.local.get(this.CACHE_KEY);
      const cacheData = cache[this.CACHE_KEY] || {};
      const entries = Object.keys(cacheData);

      const now = Date.now();
      const expiryMs = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      let removed = 0;

      entries.forEach(url => {
        if ((now - cacheData[url].timestamp) > expiryMs) {
          delete cacheData[url];
          removed++;
        }
      });

      if (removed > 0) {
        await chrome.storage.local.set({ [this.CACHE_KEY]: cacheData });
        console.log(`🗑️ Cleaned ${removed} expired cache entries`);
      }

      return removed;
    } catch (error) {
      console.error('Error cleaning cache:', error);
      return 0;
    }
  }

  /**
   * Delay helper for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current statistics (without saving)
   * @returns {Object} Current statistics
   */
  getCurrentStats() {
    return { ...this.stats };
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.RedirectResolver = RedirectResolver;
}

// For service worker context (global scope)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.RedirectResolver = RedirectResolver;
}
