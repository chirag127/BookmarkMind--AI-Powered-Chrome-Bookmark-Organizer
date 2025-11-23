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
    this.CACHE_EXPIRY_DAYS = 7;

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
        console.log(`   ├─ Final URL: ${cachedResult.finalUrl}`);
        console.log(`   ├─ Status: ${cachedResult.status}`);
        console.log(`   ├─ Cached: ${this._formatCacheAge(cachedResult.timestamp)}`);
        console.log(`   └─ Redirect chain: ${this._formatRedirectChain(cachedResult.redirectChain)}`);
        this.stats.cached++;
        return {
          originalUrl: url,
          finalUrl: cachedResult.finalUrl,
          chain: cachedResult.redirectChain.map(r => r.url),
          redirectChain: cachedResult.redirectChain,
          success: true,
          cached: true,
          status: cachedResult.status
        };
      }

      console.log(`🔍 Resolving URL (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1}): ${url}`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      try {
        // Use fetch with manual redirect handling to capture intermediate URLs
        const redirectChain = await this._followRedirects(url, controller.signal);

        clearTimeout(timeoutId);

        const finalUrl = redirectChain[redirectChain.length - 1].url;
        const finalStatus = redirectChain[redirectChain.length - 1].status;

        console.log(`✅ Successfully resolved: ${url}`);
        console.log(`   ├─ Final URL: ${finalUrl}`);
        console.log(`   ├─ Status: ${finalStatus}`);
        console.log(`   └─ Redirect chain: ${this._formatRedirectChain(redirectChain)}`);

        const result = {
          originalUrl: url,
          finalUrl: finalUrl,
          chain: redirectChain.map(r => r.url),
          redirectChain: redirectChain,
          success: true,
          cached: false,
          status: finalStatus
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

    } catch (_error) {
      console.error(`❌ Failed to resolve URL after ${retryCount + 1} attempts: ${url}`);
      console.error(`   └─ _error: ${_error.message}`);

      return {
        originalUrl: url,
        finalUrl: url,
        chain: [url],
        redirectChain: [{ url: url, status: 'error' }],
        success: false,
        error: _error.message
      };
    }
  }

  /**
   * Follow redirects manually to capture all intermediate URLs and status codes
   * @param {string} url - Starting URL
   * @param {AbortSignal} signal - Abort signal for timeout
   * @returns {Promise<Array>} Array of {url, status} objects
   */
  async _followRedirects(url, signal) {
    const redirectChain = [];
    let currentUrl = url;
    const maxRedirects = 20;
    let redirectCount = 0;

    while (redirectCount < maxRedirects) {
      try {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        const status = response.status;
        redirectChain.push({ url: currentUrl, status: status });

        // Check if this is a redirect
        if (status >= 300 && status < 400 && response.headers.get('location')) {
          const location = response.headers.get('location');
          // Handle relative URLs
          currentUrl = new URL(location, currentUrl).href;
          redirectCount++;
        } else {
          // Final destination reached
          break;
        }
      } catch (_error) {
        // If HEAD fails, try GET
        try {
          const response = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual',
            signal: signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          const status = response.status;
          redirectChain.push({ url: currentUrl, status: status });

          if (status >= 300 && status < 400 && response.headers.get('location')) {
            const location = response.headers.get('location');
            currentUrl = new URL(location, currentUrl).href;
            redirectCount++;
          } else {
            break;
          }
        } catch (getError) {
          // If both fail, add error status and break
          if (redirectChain.length === 0 || redirectChain[redirectChain.length - 1].url !== currentUrl) {
            redirectChain.push({ url: currentUrl, status: 'error' });
          }
          throw getError;
        }
      }
    }

    // If no redirects were found, ensure at least the original URL is in the chain
    if (redirectChain.length === 0) {
      redirectChain.push({ url: url, status: 200 });
    }

    return redirectChain;
  }

  /**
   * Format redirect chain for console output
   * @param {Array} redirectChain - Array of {url, status} objects
   * @returns {string} Formatted redirect chain
   */
  _formatRedirectChain(redirectChain) {
    return redirectChain.map(r => `${r.url} [${r.status}]`).join(' → ');
  }

  /**
   * Format cache age for console output
   * @param {number} timestamp - Cache timestamp
   * @returns {string} Formatted age
   */
  _formatCacheAge(timestamp) {
    const ageMs = Date.now() - timestamp;
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    if (ageDays > 0) return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
    if (ageHours > 0) return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
    if (ageMinutes > 0) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
    return 'just now';
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

    console.log('\n📊 Batch Resolution Summary:');
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

        console.log('✅ Bookmark updated successfully');
        console.log(`   ├─ Original URL: ${resolution.originalUrl}`);
        console.log(`   ├─ Final URL: ${resolution.finalUrl}`);
        console.log(`   ├─ Redirect chain: ${resolution.chain.join(' → ')}`);
        console.log(`   └─ Title preserved: "${bookmark.title}"`);

      } catch (_error) {
        console.error(`❌ Failed to update bookmark: ${_error.message}`);
        result.error = _error.message;
      }
    } else if (resolution.success) {
      console.log('ℹ️ No update needed - URL unchanged');
    } else {
      console.log('❌ Resolution failed - bookmark not updated');
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
    console.log('\n🚀 ========================================');
    console.log('📚 Starting Bookmark Redirect Resolution');
    console.log('🚀 ========================================');
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

      console.log('\n📦 ======================================');
      console.log(`📦 Batch ${batchNumber}/${totalBatches}`);
      console.log('📦 ======================================');
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

    console.log('\n📊 ========================================');
    console.log('📊 FINAL SUMMARY');
    console.log('📊 ========================================');
    console.log(`Total bookmarks: ${summary.total}`);
    console.log(`Successfully resolved (changed): ${summary.resolved}`);
    console.log(`Unchanged: ${summary.unchanged}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Cache hits: ${summary.cached}`);
    console.log(`Bookmarks updated: ${summary.updated}`);
    console.log('📊 ========================================\n');

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

        // Check if cache entry is still valid (7 days)
        if (ageInDays < this.CACHE_EXPIRY_DAYS) {
          return {
            finalUrl: cached.finalUrl,
            redirectChain: cached.redirectChain || [{ url: cached.finalUrl, status: cached.status || 200 }],
            timestamp: cached.timestamp,
            status: cached.status || 200
          };
        } else {
          console.log(`🗑️ Cache expired for: ${url} (${Math.round(ageInDays)} days old, max: ${this.CACHE_EXPIRY_DAYS} days)`);
          // Remove expired entry
          delete cacheData[url];
          await chrome.storage.local.set({ [this.CACHE_KEY]: cacheData });
        }
      }

      return null;
    } catch (_error) {
      console.error('_error reading cache:', _error);
      return null;
    }
  }

  /**
   * Cache URL resolution result
   * @param {string} url - Original URL
   * @param {Object} result - Resolution result with {finalUrl, redirectChain, status}
   */
  async _cacheUrl(url, result) {
    try {
      const cache = await chrome.storage.local.get(this.CACHE_KEY);
      const cacheData = cache[this.CACHE_KEY] || {};

      cacheData[url] = {
        finalUrl: result.finalUrl,
        redirectChain: result.redirectChain || [{ url: result.finalUrl, status: result.status || 200 }],
        timestamp: Date.now(),
        status: result.status || 200
      };

      await chrome.storage.local.set({ [this.CACHE_KEY]: cacheData });
      console.log(`💾 Cached result for: ${url} (expires in ${this.CACHE_EXPIRY_DAYS} days)`);

    } catch (_error) {
      console.error('_error writing cache:', _error);
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
    } catch (_error) {
      console.error('_error saving statistics:', _error);
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
    } catch (_error) {
      console.error('_error reading statistics:', _error);
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
    } catch (_error) {
      console.error('_error clearing cache:', _error);
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
    } catch (_error) {
      console.error('_error getting cache info:', _error);
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
    } catch (_error) {
      console.error('_error cleaning cache:', _error);
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
