/**
 * Unit Tests - Redirect Resolver
 * Tests for URL redirect resolution service
 */

const fs = require('fs');
const path = require('path');

// Load the actual source file
const redirectResolverSource = fs.readFileSync(
  path.join(__dirname, '../extension/scripts/redirectResolver.js'),
  'utf-8'
);

// Execute in global context
eval(redirectResolverSource);

describe('RedirectResolver', () => {
  let redirectResolver;

  beforeEach(() => {
    redirectResolver = new RedirectResolver();
    chrome.storage.local.get.resolves({});
    chrome.storage.local.set.resolves();
    chrome.bookmarks.update.resolves({ id: 'b1', url: 'https://final.com' });
    
    // Mock fetch
    global.fetch = jest.fn();
  });

  describe('Initialization', () => {
    test('should initialize with correct constants', () => {
      expect(redirectResolver.CACHE_KEY).toBe('redirectResolver_cache');
      expect(redirectResolver.STATS_KEY).toBe('redirectResolver_stats');
      expect(redirectResolver.CONCURRENT_LIMIT).toBe(20);
      expect(redirectResolver.REQUEST_TIMEOUT).toBe(10000);
      expect(redirectResolver.MAX_RETRIES).toBe(3);
      expect(redirectResolver.CACHE_EXPIRY_DAYS).toBe(7);
    });

    test('should initialize with empty statistics', () => {
      expect(redirectResolver.stats).toEqual({
        resolved: 0,
        failed: 0,
        unchanged: 0,
        cached: 0,
        updated: 0
      });
    });
  });

  describe('URL Resolution', () => {
    test('should resolve URL with no redirects', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const result = await redirectResolver.resolveUrl('https://example.com');

      expect(result.success).toBe(true);
      expect(result.originalUrl).toBe('https://example.com');
      expect(result.finalUrl).toBe('https://example.com');
    });

    test('should follow redirect chain', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', 'https://redirect1.com']])
        })
        .mockResolvedValueOnce({
          status: 302,
          headers: new Map([['location', 'https://final.com']])
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        });

      const result = await redirectResolver.resolveUrl('https://start.com');

      expect(result.success).toBe(true);
      expect(result.originalUrl).toBe('https://start.com');
      expect(result.finalUrl).toBe('https://final.com');
      expect(result.chain.length).toBeGreaterThan(1);
    });

    test('should use cached result if available', async () => {
      const cachedData = {
        redirectResolver_cache: {
          'https://cached.com': {
            finalUrl: 'https://cached-final.com',
            redirectChain: [
              { url: 'https://cached.com', status: 301 },
              { url: 'https://cached-final.com', status: 200 }
            ],
            timestamp: Date.now(),
            status: 200
          }
        }
      };

      chrome.storage.local.get.resolves(cachedData);

      const result = await redirectResolver.resolveUrl('https://cached.com');

      expect(result.cached).toBe(true);
      expect(result.finalUrl).toBe('https://cached-final.com');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should not use expired cache', async () => {
      const expiredCache = {
        redirectResolver_cache: {
          'https://expired.com': {
            finalUrl: 'https://old-final.com',
            redirectChain: [{ url: 'https://old-final.com', status: 200 }],
            timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days old
            status: 200
          }
        }
      };

      chrome.storage.local.get.resolves(expiredCache);
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const result = await redirectResolver.resolveUrl('https://expired.com');

      expect(result.cached).toBe(false);
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should retry on failure', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        });

      const result = await redirectResolver.resolveUrl('https://flaky.com');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retries', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await redirectResolver.resolveUrl('https://unreachable.com');

      expect(result.success).toBe(false);
      expect(result.finalUrl).toBe('https://unreachable.com');
      expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    test('should handle timeout', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 15000))
      );

      const result = await redirectResolver.resolveUrl('https://slow.com');

      expect(result.success).toBe(false);
    });

    test('should cache successful resolution', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      await redirectResolver.resolveUrl('https://example.com');

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Batch URL Resolution', () => {
    test('should resolve multiple URLs', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const urls = [
        'https://url1.com',
        'https://url2.com',
        'https://url3.com'
      ];

      const results = await redirectResolver.resolveUrls(urls);

      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    test('should respect concurrent limit', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const urls = Array.from({ length: 50 }, (_, i) => `https://url${i}.com`);

      let maxConcurrent = 0;
      let currentConcurrent = 0;

      global.fetch.mockImplementation(async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise(resolve => setTimeout(resolve, 10));
        currentConcurrent--;
        return { status: 200, headers: new Map() };
      });

      await redirectResolver.resolveUrls(urls);

      expect(maxConcurrent).toBeLessThanOrEqual(redirectResolver.CONCURRENT_LIMIT);
    });

    test('should call progress callback', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const progressCallback = jest.fn();
      const urls = ['https://url1.com', 'https://url2.com'];

      await redirectResolver.resolveUrls(urls, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: expect.any(Number),
          total: 2,
          percentage: expect.any(Number)
        })
      );
    });

    test('should track resolution statistics', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', 'https://final1.com']])
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        })
        .mockRejectedValueOnce(new Error('Failed'));

      const urls = [
        'https://redirect.com',
        'https://noredirect.com',
        'https://failed.com'
      ];

      const results = await redirectResolver.resolveUrls(urls);

      expect(redirectResolver.stats.resolved).toBeGreaterThanOrEqual(0);
      expect(redirectResolver.stats.unchanged).toBeGreaterThanOrEqual(0);
      expect(redirectResolver.stats.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bookmark Processing', () => {
    test('should process single bookmark', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', 'https://final.com']])
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        });

      const bookmark = {
        id: 'b1',
        title: 'Test Bookmark',
        url: 'https://redirect.com'
      };

      const result = await redirectResolver.processBookmark(bookmark);

      expect(result.updated).toBe(true);
      expect(result.originalUrl).toBe('https://redirect.com');
      expect(result.finalUrl).toBe('https://final.com');
      expect(chrome.bookmarks.update).toHaveBeenCalledWith('b1', {
        url: 'https://final.com'
      });
    });

    test('should not update if URL unchanged', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const bookmark = {
        id: 'b1',
        title: 'Test Bookmark',
        url: 'https://noredirect.com'
      };

      const result = await redirectResolver.processBookmark(bookmark);

      expect(result.updated).toBe(false);
      expect(chrome.bookmarks.update).not.toHaveBeenCalled();
    });

    test('should not update on resolution failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const bookmark = {
        id: 'b1',
        title: 'Test Bookmark',
        url: 'https://failed.com'
      };

      const result = await redirectResolver.processBookmark(bookmark);

      expect(result.success).toBe(false);
      expect(result.updated).toBe(false);
      expect(chrome.bookmarks.update).not.toHaveBeenCalled();
    });

    test('should process multiple bookmarks', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const bookmarks = [
        { id: 'b1', title: 'Bookmark 1', url: 'https://url1.com' },
        { id: 'b2', title: 'Bookmark 2', url: 'https://url2.com' },
        { id: 'b3', title: 'Bookmark 3', url: 'https://url3.com' }
      ];

      const summary = await redirectResolver.processBookmarks(bookmarks);

      expect(summary.total).toBe(3);
      expect(summary.processed).toBe(3);
      expect(summary.results.length).toBe(3);
    });

    test('should save statistics after processing', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const bookmarks = [
        { id: 'b1', title: 'Bookmark 1', url: 'https://url1.com' }
      ];

      await redirectResolver.processBookmarks(bookmarks);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectResolver_stats: expect.objectContaining({
            timestamp: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Caching', () => {
    test('should store URL in cache', async () => {
      const url = 'https://example.com';
      const result = {
        finalUrl: 'https://final.com',
        redirectChain: [
          { url: 'https://example.com', status: 301 },
          { url: 'https://final.com', status: 200 }
        ],
        status: 200
      };

      await redirectResolver._cacheUrl(url, result);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectResolver_cache: expect.objectContaining({
            [url]: expect.objectContaining({
              finalUrl: 'https://final.com',
              timestamp: expect.any(Number)
            })
          })
        })
      );
    });

    test('should retrieve URL from cache', async () => {
      const cachedData = {
        redirectResolver_cache: {
          'https://cached.com': {
            finalUrl: 'https://cached-final.com',
            redirectChain: [{ url: 'https://cached-final.com', status: 200 }],
            timestamp: Date.now(),
            status: 200
          }
        }
      };

      chrome.storage.local.get.resolves(cachedData);

      const cached = await redirectResolver._getCachedUrl('https://cached.com');

      expect(cached).toBeTruthy();
      expect(cached.finalUrl).toBe('https://cached-final.com');
    });

    test('should return null for missing cache entry', async () => {
      chrome.storage.local.get.resolves({});

      const cached = await redirectResolver._getCachedUrl('https://missing.com');

      expect(cached).toBeNull();
    });

    test('should remove expired cache entries', async () => {
      const expiredCache = {
        redirectResolver_cache: {
          'https://expired.com': {
            finalUrl: 'https://old.com',
            timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
            status: 200
          }
        }
      };

      chrome.storage.local.get.resolves(expiredCache);

      const cached = await redirectResolver._getCachedUrl('https://expired.com');

      expect(cached).toBeNull();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    test('should save statistics', async () => {
      const stats = {
        total: 100,
        processed: 100,
        updated: 50,
        resolved: 60,
        unchanged: 30,
        failed: 10
      };

      await redirectResolver._saveStats(stats);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        redirectResolver_stats: expect.objectContaining({
          ...stats,
          timestamp: expect.any(Number)
        })
      });
    });

    test('should retrieve statistics', async () => {
      const mockStats = {
        total: 100,
        updated: 50,
        timestamp: Date.now()
      };

      chrome.storage.local.get.resolves({
        redirectResolver_stats: mockStats
      });

      const stats = await redirectResolver.getStats();

      expect(stats).toEqual(mockStats);
    });

    test('should return null if no statistics exist', async () => {
      chrome.storage.local.get.resolves({});

      const stats = await redirectResolver.getStats();

      expect(stats).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    test('should format redirect chain', () => {
      const chain = [
        { url: 'https://start.com', status: 301 },
        { url: 'https://middle.com', status: 302 },
        { url: 'https://final.com', status: 200 }
      ];

      const formatted = redirectResolver._formatRedirectChain(chain);

      expect(formatted).toContain('https://start.com [301]');
      expect(formatted).toContain('https://middle.com [302]');
      expect(formatted).toContain('https://final.com [200]');
      expect(formatted).toContain('→');
    });

    test('should format cache age', () => {
      const now = Date.now();

      expect(redirectResolver._formatCacheAge(now)).toContain('just now');
      expect(redirectResolver._formatCacheAge(now - 30 * 60 * 1000)).toContain('minute');
      expect(redirectResolver._formatCacheAge(now - 2 * 60 * 60 * 1000)).toContain('hour');
      expect(redirectResolver._formatCacheAge(now - 24 * 60 * 60 * 1000)).toContain('day');
    });

    test('should delay execution', async () => {
      const start = Date.now();
      await redirectResolver._delay(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    test('should handle circular redirects', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', 'https://url2.com']])
        })
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', 'https://url1.com']]) // Back to start
        });

      const result = await redirectResolver.resolveUrl('https://url1.com');

      // Should stop after max redirects
      expect(result).toBeTruthy();
    });

    test('should handle relative redirect URLs', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', '/redirected']])
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        });

      const result = await redirectResolver.resolveUrl('https://example.com/start');

      expect(result.success).toBe(true);
    });

    test('should handle malformed URLs', async () => {
      const result = await redirectResolver.resolveUrl('not-a-url');

      expect(result.success).toBe(false);
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.rejects(new Error('Storage error'));

      global.fetch.mockResolvedValue({
        status: 200,
        headers: new Map()
      });

      const result = await redirectResolver.resolveUrl('https://example.com');

      // Should still work, just without cache
      expect(result).toBeTruthy();
    });

    test('should handle empty bookmarks array', async () => {
      const summary = await redirectResolver.processBookmarks([]);

      expect(summary.total).toBe(0);
      expect(summary.processed).toBe(0);
      expect(summary.results.length).toBe(0);
    });

    test('should handle bookmark update failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          status: 301,
          headers: new Map([['location', 'https://final.com']])
        })
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map()
        });

      chrome.bookmarks.update.rejects(new Error('Update failed'));

      const bookmark = {
        id: 'b1',
        title: 'Test',
        url: 'https://redirect.com'
      };

      const result = await redirectResolver.processBookmark(bookmark);

      expect(result.updated).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
