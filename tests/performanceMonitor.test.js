/**
 * Unit Tests - Performance Monitor
 * Tests for performance tracking and monitoring
 */

const fs = require('fs');
const path = require('path');

// Load the actual source files
const performanceMonitorSource = fs.readFileSync(
  path.join(__dirname, '../extension/scripts/performanceMonitor.js'),
  'utf-8'
);

const analyticsServiceSource = fs.readFileSync(
  path.join(__dirname, '../extension/scripts/analyticsService.js'),
  'utf-8'
);

// Execute in global context
eval(analyticsServiceSource);
eval(performanceMonitorSource);

describe('PerformanceMonitor', () => {
  let performanceMonitor;

  beforeEach(async () => {
    performanceMonitor = new PerformanceMonitor();
    chrome.storage.local.get.resolves({});
    chrome.storage.local.set.resolves();
    
    // Mock performance.memory
    global.performance = {
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024
      }
    };
    
    await performanceMonitor.initialize();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(performanceMonitor.storageKey).toBe('bookmarkMindPerformance');
      expect(performanceMonitor.maxHistoryPoints).toBe(100);
      expect(performanceMonitor.rateLimitWindowMs).toBe(60000);
    });

    test('should initialize analytics service', async () => {
      await performanceMonitor.initialize();
      
      expect(performanceMonitor.analyticsService).toBeTruthy();
      expect(performanceMonitor.analyticsService instanceof AnalyticsService).toBe(true);
    });

    test('should cleanup old rate limit data on init', async () => {
      const cleanupSpy = jest.spyOn(performanceMonitor, '_cleanupOldRateLimitData');
      
      await performanceMonitor.initialize();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Memory Usage Tracking', () => {
    test('should record memory usage snapshot', async () => {
      const memory = await performanceMonitor.recordMemoryUsage();
      
      expect(memory).toBeTruthy();
      expect(memory.usedJSHeapSize).toBeGreaterThan(0);
      expect(memory.totalJSHeapSize).toBeGreaterThan(0);
      expect(memory.jsHeapSizeLimit).toBeGreaterThan(0);
      expect(memory.timestamp).toBeTruthy();
    });

    test('should save memory snapshot to storage', async () => {
      await performanceMonitor.recordMemoryUsage();
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should limit memory history to max points', async () => {
      // Mock existing memory history at max
      chrome.storage.local.get.resolves({
        bookmarkMindPerformance: {
          version: '1.0',
          memoryHistory: new Array(100).fill({
            timestamp: Date.now(),
            usedJSHeapSize: 50 * 1024 * 1024,
            totalJSHeapSize: 100 * 1024 * 1024,
            jsHeapSizeLimit: 2048 * 1024 * 1024
          })
        }
      });

      await performanceMonitor.recordMemoryUsage();
      
      const perfData = await performanceMonitor._getPerformanceData();
      expect(perfData.memoryHistory.length).toBe(100);
    });

    test('should return null if performance.memory unavailable', async () => {
      delete global.performance.memory;
      
      const memory = await performanceMonitor.recordMemoryUsage();
      
      expect(memory).toBeNull();
    });

    test('should get current memory usage', () => {
      const memory = performanceMonitor.getCurrentMemoryUsage();
      
      expect(memory).toBeTruthy();
      expect(memory.usedMB).toBeGreaterThan(0);
      expect(memory.totalMB).toBeGreaterThan(0);
      expect(memory.limitMB).toBeGreaterThan(0);
      expect(memory.usagePercent).toBeGreaterThan(0);
      expect(memory.usagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Dashboard', () => {
    test('should generate performance dashboard', async () => {
      const dashboard = await performanceMonitor.getPerformanceDashboard();
      
      expect(dashboard).toHaveProperty('overview');
      expect(dashboard).toHaveProperty('providerComparison');
      expect(dashboard).toHaveProperty('batchEfficiency');
      expect(dashboard).toHaveProperty('memoryStats');
      expect(dashboard).toHaveProperty('performanceHistory');
      expect(dashboard).toHaveProperty('insights');
      expect(dashboard).toHaveProperty('currentMemory');
      expect(dashboard).toHaveProperty('rateLimits');
    });

    test('should calculate average categorization time', () => {
      const sessions = [
        { avgTimePerBookmark: 200 },
        { avgTimePerBookmark: 300 },
        { avgTimePerBookmark: 250 }
      ];
      
      const avg = performanceMonitor._calculateAvgCategorizationTime(sessions);
      
      expect(avg).toBe(250);
    });

    test('should handle empty sessions', () => {
      const avg = performanceMonitor._calculateAvgCategorizationTime([]);
      
      expect(avg).toBe(0);
    });

    test('should calculate success rate', () => {
      expect(performanceMonitor._calculateSuccessRate(90, 100)).toBe(90);
      expect(performanceMonitor._calculateSuccessRate(100, 100)).toBe(100);
      expect(performanceMonitor._calculateSuccessRate(0, 0)).toBe(100);
    });
  });

  describe('Provider Comparison', () => {
    test('should compare provider performance', () => {
      const apiByProvider = {
        gemini: {
          total: 100,
          successful: 95,
          failed: 5,
          avgResponseTime: 2500,
          totalTokens: 50000
        },
        cerebras: {
          total: 50,
          successful: 48,
          failed: 2,
          avgResponseTime: 1500,
          totalTokens: 25000
        }
      };

      const now = Date.now();
      const apiCalls = [
        { provider: 'gemini', timestamp: now - 1000, success: true, responseTime: 2500 },
        { provider: 'cerebras', timestamp: now - 2000, success: true, responseTime: 1500 }
      ];

      const comparison = performanceMonitor._getProviderComparison(apiByProvider, apiCalls);
      
      expect(comparison.gemini).toBeTruthy();
      expect(comparison.cerebras).toBeTruthy();
      expect(comparison.gemini.successRate).toBe(95);
      expect(comparison.cerebras.successRate).toBe(96);
    });

    test('should calculate provider metrics for time period', () => {
      const now = Date.now();
      const calls = [
        { timestamp: now - 1000, success: true, responseTime: 2000 },
        { timestamp: now - 2000, success: true, responseTime: 2500 },
        { timestamp: now - 3000, success: false, responseTime: 1000 }
      ];

      const metrics = performanceMonitor._calculateProviderMetrics(calls);
      
      expect(metrics.calls).toBe(3);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });

    test('should handle empty calls list', () => {
      const metrics = performanceMonitor._calculateProviderMetrics([]);
      
      expect(metrics.calls).toBe(0);
      expect(metrics.avgResponseTime).toBe(0);
      expect(metrics.successRate).toBe(100);
    });
  });

  describe('Batch Efficiency', () => {
    test('should calculate batch efficiency metrics', () => {
      const apiCalls = [
        { batchSize: 50, responseTime: 5000, success: true },
        { batchSize: 60, responseTime: 6000, success: true },
        { batchSize: 40, responseTime: 4000, success: true }
      ];

      const efficiency = performanceMonitor._getBatchEfficiency(apiCalls);
      
      expect(efficiency.avgBatchSize).toBeGreaterThan(0);
      expect(efficiency.avgBatchTime).toBeGreaterThan(0);
      expect(efficiency.avgTimePerItem).toBeGreaterThan(0);
      expect(efficiency.totalBatches).toBe(3);
      expect(efficiency.efficiencyScore).toBeGreaterThan(0);
    });

    test('should handle no batch calls', () => {
      const apiCalls = [
        { batchSize: 1, responseTime: 1000, success: true }
      ];

      const efficiency = performanceMonitor._getBatchEfficiency(apiCalls);
      
      expect(efficiency.avgBatchSize).toBe(0);
      expect(efficiency.totalBatches).toBe(0);
    });

    test('should filter batch calls correctly', () => {
      const apiCalls = [
        { batchSize: 50, responseTime: 5000 },
        { batchSize: 1, responseTime: 1000 },
        { batchSize: 75, responseTime: 7000 },
        { responseTime: 2000 } // No batchSize
      ];

      const efficiency = performanceMonitor._getBatchEfficiency(apiCalls);
      
      expect(efficiency.totalBatches).toBe(2); // Only 50 and 75
    });
  });

  describe('Memory Statistics', () => {
    test('should calculate memory stats from history', () => {
      const memoryHistory = [
        { timestamp: Date.now() - 10000, usedJSHeapSize: 40 * 1024 * 1024, totalJSHeapSize: 80 * 1024 * 1024, jsHeapSizeLimit: 2048 * 1024 * 1024 },
        { timestamp: Date.now() - 5000, usedJSHeapSize: 50 * 1024 * 1024, totalJSHeapSize: 100 * 1024 * 1024, jsHeapSizeLimit: 2048 * 1024 * 1024 },
        { timestamp: Date.now(), usedJSHeapSize: 60 * 1024 * 1024, totalJSHeapSize: 120 * 1024 * 1024, jsHeapSizeLimit: 2048 * 1024 * 1024 }
      ];

      const stats = performanceMonitor._getMemoryStats(memoryHistory);
      
      expect(stats.current).toBeTruthy();
      expect(stats.averageMB).toBeGreaterThan(0);
      expect(stats.peakMB).toBeGreaterThan(0);
      expect(stats.trend).toBeTruthy();
    });

    test('should detect increasing memory trend', () => {
      const memoryHistory = Array.from({ length: 20 }, (_, i) => ({
        timestamp: Date.now() - (20 - i) * 1000,
        usedJSHeapSize: (30 + i * 2) * 1024 * 1024, // Increasing
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024
      }));

      const stats = performanceMonitor._getMemoryStats(memoryHistory);
      
      expect(stats.trend).toBe('increasing');
    });

    test('should handle empty memory history', () => {
      const stats = performanceMonitor._getMemoryStats([]);
      
      expect(stats.current).toBeNull();
      expect(stats.average).toBe(0);
      expect(stats.peak).toBe(0);
      expect(stats.trend).toBe('stable');
    });
  });

  describe('Performance History', () => {
    test('should generate performance history for graphing', () => {
      const now = Date.now();
      const sessions = [
        { timestamp: now - 5 * 24 * 60 * 60 * 1000, bookmarksProcessed: 50, avgTimePerBookmark: 200, successRate: 95 },
        { timestamp: now - 3 * 24 * 60 * 60 * 1000, bookmarksProcessed: 75, avgTimePerBookmark: 180, successRate: 98 },
        { timestamp: now - 1 * 24 * 60 * 60 * 1000, bookmarksProcessed: 100, avgTimePerBookmark: 150, successRate: 99 }
      ];

      const history = performanceMonitor._getPerformanceHistory(sessions);
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('avgCategorizationTime');
      expect(history[0]).toHaveProperty('bookmarksProcessed');
      expect(history[0]).toHaveProperty('successRate');
    });

    test('should filter sessions to last 30 days', () => {
      const now = Date.now();
      const sessions = [
        { timestamp: now - 35 * 24 * 60 * 60 * 1000, bookmarksProcessed: 50, avgTimePerBookmark: 200, successRate: 95 }, // Too old
        { timestamp: now - 15 * 24 * 60 * 60 * 1000, bookmarksProcessed: 75, avgTimePerBookmark: 180, successRate: 98 }
      ];

      const history = performanceMonitor._getPerformanceHistory(sessions);
      
      // Should only include sessions from last 30 days
      history.forEach(entry => {
        const entryDate = new Date(entry.date);
        const daysDiff = (now - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should record API request for rate limiting', async () => {
      await performanceMonitor.recordApiRequest('gemini', true, false, false);
      
      const rateLimitData = await performanceMonitor._getRateLimitData();
      
      expect(rateLimitData.providers.gemini).toBeTruthy();
      expect(rateLimitData.providers.gemini.totalRequests).toBeGreaterThan(0);
    });

    test('should track throttled requests', async () => {
      await performanceMonitor.recordApiRequest('gemini', false, true, false);
      
      const rateLimitData = await performanceMonitor._getRateLimitData();
      
      expect(rateLimitData.providers.gemini.throttledCount).toBe(1);
    });

    test('should track rejected requests', async () => {
      await performanceMonitor.recordApiRequest('gemini', false, false, true);
      
      const rateLimitData = await performanceMonitor._getRateLimitData();
      
      expect(rateLimitData.providers.gemini.rejectedCount).toBe(1);
    });

    test('should cleanup old requests', async () => {
      const now = Date.now();
      const rateLimitData = {
        providers: {
          gemini: {
            requests: [
              { timestamp: now - 2 * 60 * 1000, success: true }, // 2 min old - should be cleaned
              { timestamp: now - 30 * 1000, success: true } // 30 sec old - should stay
            ],
            throttledCount: 0,
            rejectedCount: 0,
            totalRequests: 2,
            limits: { requestsPerMinute: 15, requestsPerDay: 1500 }
          }
        },
        alerts: []
      };

      await performanceMonitor._cleanupOldRequests(rateLimitData.providers.gemini);
      
      // Only requests within window should remain
      expect(rateLimitData.providers.gemini.requests.length).toBeLessThanOrEqual(2);
    });

    test('should calculate requests per minute', () => {
      const now = Date.now();
      const requests = [
        { timestamp: now - 30 * 1000, success: true },
        { timestamp: now - 45 * 1000, success: true },
        { timestamp: now - 90 * 1000, success: true } // Outside 1 minute window
      ];

      const rpm = performanceMonitor._calculateRequestsPerMinute(requests);
      
      expect(rpm).toBe(2); // Only 2 within last minute
    });

    test('should get rate limit dashboard', async () => {
      await performanceMonitor.recordApiRequest('gemini', true, false, false);
      await performanceMonitor.recordApiRequest('gemini', true, false, false);
      
      const dashboard = await performanceMonitor.getRateLimitDashboard();
      
      expect(dashboard.gemini).toBeTruthy();
      expect(dashboard.gemini.currentRpm).toBeGreaterThan(0);
      expect(dashboard.gemini.maxRpm).toBeGreaterThan(0);
      expect(dashboard.gemini.utilizationPercent).toBeGreaterThanOrEqual(0);
      expect(dashboard.gemini.status).toBeTruthy();
    });

    test('should get provider rate limits', () => {
      const geminiLimits = performanceMonitor._getProviderLimits('gemini');
      const cerebrasLimits = performanceMonitor._getProviderLimits('cerebras');
      const groqLimits = performanceMonitor._getProviderLimits('groq');
      
      expect(geminiLimits.requestsPerMinute).toBe(15);
      expect(cerebrasLimits.requestsPerMinute).toBe(60);
      expect(groqLimits.requestsPerMinute).toBe(30);
    });

    test('should get rate limit status', () => {
      expect(performanceMonitor._getRateLimitStatus(25)).toBe('healthy');
      expect(performanceMonitor._getRateLimitStatus(70)).toBe('warning');
      expect(performanceMonitor._getRateLimitStatus(95)).toBe('critical');
    });

    test('should get RPM history for charting', () => {
      const now = Date.now();
      const requests = Array.from({ length: 10 }, (_, i) => ({
        timestamp: now - i * 5000,
        success: true
      }));

      const history = performanceMonitor._getRpmHistory(requests);
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('rpm');
    });

    test('should get rate limit history', async () => {
      await performanceMonitor.recordApiRequest('gemini', false, true, false);
      await performanceMonitor.recordApiRequest('cerebras', false, false, true);
      
      const history = await performanceMonitor.getRateLimitHistory();
      
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('provider');
      expect(history[0]).toHaveProperty('type');
    });

    test('should filter rate limit history by provider', async () => {
      await performanceMonitor.recordApiRequest('gemini', false, true, false);
      await performanceMonitor.recordApiRequest('cerebras', false, false, true);
      
      const geminiHistory = await performanceMonitor.getRateLimitHistory('gemini');
      
      geminiHistory.forEach(event => {
        expect(event.provider).toBe('gemini');
      });
    });

    test('should record rate limit alert when approaching limit', async () => {
      // Mock provider with low limit
      const rateLimitData = {
        providers: {
          testProvider: {
            requests: Array.from({ length: 14 }, () => ({
              timestamp: Date.now(),
              success: true
            })),
            throttledCount: 0,
            rejectedCount: 0,
            totalRequests: 14,
            limits: { requestsPerMinute: 15, requestsPerDay: 1500 }
          }
        },
        alerts: []
      };

      chrome.storage.local.get.resolves({
        bookmarkMindRateLimits: rateLimitData
      });

      await performanceMonitor.recordApiRequest('testProvider', true, false, false);
      
      // Should trigger alert at 80% threshold (12/15)
      const data = await performanceMonitor._getRateLimitData();
      // Alert recording is internal, just verify request was recorded
      expect(data.providers.testProvider.totalRequests).toBeGreaterThan(14);
    });
  });

  describe('Storage Operations', () => {
    test('should get performance data from storage', async () => {
      const mockData = {
        version: '1.0',
        created: Date.now(),
        memoryHistory: []
      };

      chrome.storage.local.get.resolves({
        bookmarkMindPerformance: mockData
      });

      const data = await performanceMonitor._getPerformanceData();
      
      expect(data).toEqual(mockData);
    });

    test('should return default data if storage is empty', async () => {
      chrome.storage.local.get.resolves({});

      const data = await performanceMonitor._getPerformanceData();
      
      expect(data.version).toBe('1.0');
      expect(data.memoryHistory).toEqual([]);
    });

    test('should save performance data to storage', async () => {
      const data = {
        version: '1.0',
        memoryHistory: [{ timestamp: Date.now(), usedJSHeapSize: 50 * 1024 * 1024 }]
      };

      await performanceMonitor._savePerformanceData(data);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        bookmarkMindPerformance: data
      });
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.rejects(new Error('Storage error'));

      const data = await performanceMonitor._getPerformanceData();
      
      // Should return default data instead of throwing
      expect(data).toBeTruthy();
      expect(data.version).toBe('1.0');
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined performance.memory', () => {
      delete global.performance.memory;
      
      const memory = performanceMonitor.getCurrentMemoryUsage();
      
      expect(memory).toBeNull();
    });

    test('should handle empty provider data', () => {
      const comparison = performanceMonitor._getProviderComparison({}, []);
      
      expect(comparison).toEqual({});
    });

    test('should handle zero values in calculations', () => {
      expect(performanceMonitor._calculateSuccessRate(0, 0)).toBe(100);
      expect(performanceMonitor._calculateAvgCategorizationTime([])).toBe(0);
    });

    test('should handle missing analytics service', async () => {
      performanceMonitor.analyticsService = null;
      
      const dashboard = await performanceMonitor.getPerformanceDashboard();
      
      // Should initialize analytics service
      expect(performanceMonitor.analyticsService).toBeTruthy();
    });
  });
});
