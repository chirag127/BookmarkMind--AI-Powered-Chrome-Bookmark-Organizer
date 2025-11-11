/**
 * BookmarkMind - Performance Monitor
 * Tracks and analyzes system performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.storageKey = 'bookmarkMindPerformance';
    this.maxHistoryPoints = 100;
    this.analyticsService = null;
  }

  /**
     * Initialize performance monitor
     */
  async initialize() {
    if (typeof AnalyticsService !== 'undefined') {
      this.analyticsService = new AnalyticsService();
    }
  }

  /**
     * Record memory usage snapshot
     */
  async recordMemoryUsage() {
    if (performance.memory) {
      const memory = {
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };

      const perfData = await this._getPerformanceData();
      perfData.memoryHistory.push(memory);

      if (perfData.memoryHistory.length > this.maxHistoryPoints) {
        perfData.memoryHistory = perfData.memoryHistory.slice(-this.maxHistoryPoints);
      }

      await this._savePerformanceData(perfData);
      return memory;
    }
    return null;
  }

  /**
     * Get current memory usage
     */
  getCurrentMemoryUsage() {
    if (performance.memory) {
      return {
        usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limitMB: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        usagePercent: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  }

  /**
     * Get performance dashboard data
     */
  async getPerformanceDashboard() {
    if (!this.analyticsService) {
      await this.initialize();
    }

    const analytics = await this.analyticsService.exportAnalytics();
    const perfData = await this._getPerformanceData();
    const insights = await this.analyticsService.getPerformanceInsights();

    // Calculate metrics
    const dashboard = {
      overview: {
        avgCategorizationTime: this._calculateAvgCategorizationTime(analytics.sessions),
        totalProcessed: analytics.totalCategorizations,
        successRate: this._calculateSuccessRate(
          analytics.totalCategorizations,
          analytics.totalCategorizations + analytics.totalErrors
        ),
        lastUpdated: Date.now()
      },
      providerComparison: this._getProviderComparison(analytics.apiByProvider, analytics.apiCalls),
      batchEfficiency: this._getBatchEfficiency(analytics.apiCalls),
      memoryStats: this._getMemoryStats(perfData.memoryHistory),
      performanceHistory: this._getPerformanceHistory(analytics.sessions),
      insights: insights,
      currentMemory: this.getCurrentMemoryUsage()
    };

    return dashboard;
  }

  /**
     * Calculate average categorization time
     * @private
     */
  _calculateAvgCategorizationTime(sessions) {
    if (sessions.length === 0) return 0;
    const recentSessions = sessions.slice(-20);
    const total = recentSessions.reduce((sum, s) => sum + (s.avgTimePerBookmark || 0), 0);
    return Math.round(total / recentSessions.length);
  }

  /**
     * Calculate success rate
     * @private
     */
  _calculateSuccessRate(successful, total) {
    if (total === 0) return 100;
    return Math.round((successful / total) * 100);
  }

  /**
     * Get provider comparison data
     * @private
     */
  _getProviderComparison(apiByProvider, apiCalls) {
    const comparison = {};
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    for (const [provider, data] of Object.entries(apiByProvider)) {
      const providerCalls = apiCalls.filter(c => c.provider === provider);
      const recentCalls = providerCalls.filter(c => c.timestamp >= last24h);
      const weekCalls = providerCalls.filter(c => c.timestamp >= last7d);

      comparison[provider] = {
        totalCalls: data.total,
        successRate: Math.round((data.successful / data.total) * 100),
        avgResponseTime: data.avgResponseTime || 0,
        recentPerformance: {
          last24h: this._calculateProviderMetrics(recentCalls),
          last7d: this._calculateProviderMetrics(weekCalls)
        },
        totalTokens: data.totalTokens
      };
    }

    return comparison;
  }

  /**
     * Calculate provider metrics for a set of calls
     * @private
     */
  _calculateProviderMetrics(calls) {
    if (calls.length === 0) {
      return { calls: 0, avgResponseTime: 0, successRate: 100 };
    }

    const successful = calls.filter(c => c.success).length;
    const totalResponseTime = calls.reduce((sum, c) => sum + c.responseTime, 0);

    return {
      calls: calls.length,
      avgResponseTime: Math.round(totalResponseTime / calls.length),
      successRate: Math.round((successful / calls.length) * 100)
    };
  }

  /**
     * Get batch processing efficiency metrics
     * @private
     */
  _getBatchEfficiency(apiCalls) {
    const batchCalls = apiCalls.filter(c => c.batchSize && c.batchSize > 1);

    if (batchCalls.length === 0) {
      return {
        avgBatchSize: 0,
        avgBatchTime: 0,
        avgTimePerItem: 0,
        totalBatches: 0,
        efficiencyScore: 0
      };
    }

    const totalBatchSize = batchCalls.reduce((sum, c) => sum + c.batchSize, 0);
    const totalBatchTime = batchCalls.reduce((sum, c) => sum + c.responseTime, 0);
    const avgBatchSize = totalBatchSize / batchCalls.length;
    const avgBatchTime = totalBatchTime / batchCalls.length;
    const avgTimePerItem = avgBatchSize > 0 ? avgBatchTime / avgBatchSize : 0;

    // Calculate efficiency score (higher is better)
    // Based on: larger batches with lower per-item time
    const efficiencyScore = avgBatchSize > 0 && avgTimePerItem > 0
      ? Math.round((avgBatchSize / avgTimePerItem) * 1000)
      : 0;

    return {
      avgBatchSize: Math.round(avgBatchSize),
      avgBatchTime: Math.round(avgBatchTime),
      avgTimePerItem: Math.round(avgTimePerItem),
      totalBatches: batchCalls.length,
      efficiencyScore: efficiencyScore
    };
  }

  /**
     * Get memory statistics
     * @private
     */
  _getMemoryStats(memoryHistory) {
    if (memoryHistory.length === 0) {
      return {
        current: null,
        average: 0,
        peak: 0,
        trend: 'stable'
      };
    }

    const recent = memoryHistory.slice(-1)[0];
    const avgUsed = memoryHistory.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / memoryHistory.length;
    const peakUsed = Math.max(...memoryHistory.map(m => m.usedJSHeapSize));

    // Calculate trend
    let trend = 'stable';
    if (memoryHistory.length >= 10) {
      const firstHalf = memoryHistory.slice(0, Math.floor(memoryHistory.length / 2));
      const secondHalf = memoryHistory.slice(Math.floor(memoryHistory.length / 2));

      const avgFirst = firstHalf.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / secondHalf.length;

      if (avgSecond > avgFirst * 1.2) {
        trend = 'increasing';
      } else if (avgSecond < avgFirst * 0.8) {
        trend = 'decreasing';
      }
    }

    return {
      current: recent ? {
        usedMB: Math.round(recent.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(recent.totalJSHeapSize / 1024 / 1024),
        limitMB: Math.round(recent.jsHeapSizeLimit / 1024 / 1024),
        timestamp: recent.timestamp
      } : null,
      averageMB: Math.round(avgUsed / 1024 / 1024),
      peakMB: Math.round(peakUsed / 1024 / 1024),
      trend: trend
    };
  }

  /**
     * Get performance history for graphing
     * @private
     */
  _getPerformanceHistory(sessions) {
    const history = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get sessions from last 30 days
    const recentSessions = sessions.filter(s => s.timestamp >= thirtyDaysAgo);

    // Group by day
    const dayGroups = {};
    recentSessions.forEach(session => {
      const day = new Date(session.timestamp).toISOString().split('T')[0];
      if (!dayGroups[day]) {
        dayGroups[day] = [];
      }
      dayGroups[day].push(session);
    });

    // Calculate daily averages
    for (const [day, daySessions] of Object.entries(dayGroups)) {
      const avgTime = daySessions.reduce((sum, s) => sum + s.avgTimePerBookmark, 0) / daySessions.length;
      const totalProcessed = daySessions.reduce((sum, s) => sum + s.bookmarksProcessed, 0);
      const avgSuccessRate = daySessions.reduce((sum, s) => sum + s.successRate, 0) / daySessions.length;

      history.push({
        date: day,
        avgCategorizationTime: Math.round(avgTime),
        bookmarksProcessed: totalProcessed,
        successRate: Math.round(avgSuccessRate),
        sessions: daySessions.length
      });
    }

    return history.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
     * Get performance data from storage
     * @private
     */
  async _getPerformanceData() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      return result[this.storageKey] || this._getDefaultPerformanceData();
    } catch (error) {
      console.error('Error getting performance data:', error);
      return this._getDefaultPerformanceData();
    }
  }

  /**
     * Save performance data to storage
     * @private
     */
  async _savePerformanceData(data) {
    try {
      await chrome.storage.local.set({ [this.storageKey]: data });
    } catch (error) {
      console.error('Error saving performance data:', error);
    }
  }

  /**
     * Get default performance data structure
     * @private
     */
  _getDefaultPerformanceData() {
    return {
      version: '1.0',
      created: Date.now(),
      memoryHistory: []
    };
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
}

// For service worker context
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.PerformanceMonitor = PerformanceMonitor;
}
