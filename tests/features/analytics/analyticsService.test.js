import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Unit Tests - Analytics Service
 * Tests for analytics tracking and reporting
 */

import fs from 'fs';
import path from 'path';

// Load the actual source file
const analyticsServiceSource = fs.readFileSync(
  path.join(__dirname, '../../../extension/features/analytics/analyticsService.js'),
  'utf-8'
);

// Execute in global context to define the class
eval(analyticsServiceSource);

describe('AnalyticsService', () => {
  let analyticsService;

  beforeEach(async () => {
    analyticsService = new AnalyticsService();
    chrome.storage.local.get.resolves({});
    chrome.storage.local.set.resolves();
    await analyticsService.initialize();
  });

  describe('Initialization', () => {
    test('should initialize with default storage keys', () => {
      expect(analyticsService.storageKey).toBe('bookmarkMindAnalytics');
      expect(analyticsService.sessionKey).toBe('bookmarkMindSession');
    });

    test('should initialize analytics data if not present', async () => {
      chrome.storage.local.get.resolves({});
      
      await analyticsService.initialize();

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should not reset analytics if version exists', async () => {
      chrome.storage.local.get.resolves({
        bookmarkMindAnalytics: {
          version: '1.0',
          sessions: [],
          apiCalls: []
        }
      });

      const setSpy = jest.spyOn(chrome.storage.local, 'set');
      setSpy.mockClear();

      await analyticsService.initialize();

      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('Session Recording', () => {
    test('should record categorization session', async () => {
      const sessionData = {
        processed: 50,
        categorized: 45,
        errors: 5,
        duration: 30000,
        categories: ['Work', 'Personal'],
        mode: 'full'
      };

      await analyticsService.recordCategorizationSession(sessionData);

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should calculate success rate correctly', async () => {
      const sessionData = {
        processed: 100,
        categorized: 85,
        errors: 15,
        duration: 60000,
        categories: ['Work']
      };

      await analyticsService.recordCategorizationSession(sessionData);

      const analytics = await analyticsService._getAnalytics();
      const lastSession = analytics.sessions[analytics.sessions.length - 1];

      expect(lastSession.successRate).toBe(85);
    });

    test('should calculate average time per bookmark', async () => {
      const sessionData = {
        processed: 50,
        categorized: 50,
        errors: 0,
        duration: 10000,
        categories: []
      };

      await analyticsService.recordCategorizationSession(sessionData);

      const analytics = await analyticsService._getAnalytics();
      const lastSession = analytics.sessions[analytics.sessions.length - 1];

      expect(lastSession.avgTimePerBookmark).toBe(200);
    });

    test('should track category usage', async () => {
      const sessionData = {
        processed: 10,
        categorized: 10,
        errors: 0,
        duration: 5000,
        categories: ['Work', 'Personal', 'Work']
      };

      await analyticsService.recordCategorizationSession(sessionData);

      const analytics = await analyticsService._getAnalytics();

      expect(analytics.categoryUsage['Work']).toBeGreaterThan(0);
      expect(analytics.categoryUsage['Personal']).toBeGreaterThan(0);
    });

    test('should limit session history to 100 entries', async () => {
      // Mock existing 100 sessions
      chrome.storage.local.get.resolves({
        bookmarkMindAnalytics: {
          version: '1.0',
          sessions: new Array(100).fill({ processed: 1, categorized: 1 }),
          apiCalls: [],
          categoryUsage: {},
          apiByProvider: {},
          processingTimes: {},
          consolidations: [],
          totalCategorizations: 0,
          totalErrors: 0,
          totalApiCalls: 0,
          successfulApiCalls: 0,
          failedApiCalls: 0,
          totalFoldersConsolidated: 0,
          totalBookmarksReorganized: 0
        }
      });

      await analyticsService.recordCategorizationSession({
        processed: 1,
        categorized: 1,
        errors: 0,
        duration: 1000,
        categories: []
      });

      const analytics = await analyticsService._getAnalytics();
      expect(analytics.sessions.length).toBe(100);
    });
  });

  describe('API Usage Recording', () => {
    test('should record API call', async () => {
      const apiData = {
        provider: 'gemini',
        model: 'gemini-2.5-pro',
        tokensUsed: 1500,
        success: true,
        responseTime: 2500,
        batchSize: 50
      };

      await analyticsService.recordApiUsage(apiData);

      const analytics = await analyticsService._getAnalytics();

      expect(analytics.apiCalls.length).toBeGreaterThan(0);
      expect(analytics.totalApiCalls).toBeGreaterThan(0);
    });

    test('should track successful API calls', async () => {
      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        responseTime: 1000
      });

      const analytics = await analyticsService._getAnalytics();

      expect(analytics.successfulApiCalls).toBe(1);
      expect(analytics.failedApiCalls).toBe(0);
    });

    test('should track failed API calls', async () => {
      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: false,
        errorType: 'rate_limit',
        responseTime: 500
      });

      const analytics = await analyticsService._getAnalytics();

      expect(analytics.successfulApiCalls).toBe(0);
      expect(analytics.failedApiCalls).toBe(1);
    });

    test('should aggregate stats by provider', async () => {
      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        tokensUsed: 1000,
        responseTime: 2000
      });

      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        tokensUsed: 1500,
        responseTime: 3000
      });

      const analytics = await analyticsService._getAnalytics();
      const geminiStats = analytics.apiByProvider.gemini;

      expect(geminiStats.total).toBe(2);
      expect(geminiStats.successful).toBe(2);
      expect(geminiStats.totalTokens).toBe(2500);
      expect(geminiStats.avgResponseTime).toBeGreaterThan(0);
    });

    test('should limit API call history to 1000 entries', async () => {
      chrome.storage.local.get.resolves({
        bookmarkMindAnalytics: {
          version: '1.0',
          sessions: [],
          apiCalls: new Array(1000).fill({ provider: 'test', success: true }),
          categoryUsage: {},
          apiByProvider: {},
          processingTimes: {},
          consolidations: [],
          totalCategorizations: 0,
          totalErrors: 0,
          totalApiCalls: 1000,
          successfulApiCalls: 1000,
          failedApiCalls: 0,
          totalFoldersConsolidated: 0,
          totalBookmarksReorganized: 0
        }
      });

      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true
      });

      const analytics = await analyticsService._getAnalytics();
      expect(analytics.apiCalls.length).toBe(1000);
    });
  });

  describe('Processing Time Recording', () => {
    test('should record processing time for operation', async () => {
      await analyticsService.recordProcessingTime('categorization', 5000);

      const analytics = await analyticsService._getAnalytics();

      expect(analytics.processingTimes.categorization).toBeTruthy();
      expect(analytics.processingTimes.categorization.length).toBeGreaterThan(0);
    });

    test('should limit processing time history to 100 per operation', async () => {
      chrome.storage.local.get.resolves({
        bookmarkMindAnalytics: {
          version: '1.0',
          sessions: [],
          apiCalls: [],
          categoryUsage: {},
          apiByProvider: {},
          processingTimes: {
            categorization: new Array(100).fill({ timestamp: Date.now(), duration: 1000 })
          },
          consolidations: [],
          totalCategorizations: 0,
          totalErrors: 0,
          totalApiCalls: 0,
          successfulApiCalls: 0,
          failedApiCalls: 0,
          totalFoldersConsolidated: 0,
          totalBookmarksReorganized: 0
        }
      });

      await analyticsService.recordProcessingTime('categorization', 2000);

      const analytics = await analyticsService._getAnalytics();
      expect(analytics.processingTimes.categorization.length).toBe(100);
    });
  });

  describe('Consolidation Recording', () => {
    test('should record folder consolidation', async () => {
      const consolidationData = {
        foldersProcessed: 50,
        bookmarksMoved: 100,
        foldersRemoved: 10,
        consolidationPaths: [
          'Work/Projects > Work > Projects'
        ]
      };

      await analyticsService.recordConsolidation(consolidationData);

      const analytics = await analyticsService._getAnalytics();

      expect(analytics.consolidations.length).toBeGreaterThan(0);
      expect(analytics.totalFoldersConsolidated).toBe(10);
      expect(analytics.totalBookmarksReorganized).toBe(100);
    });

    test('should limit consolidation history to 50 entries', async () => {
      chrome.storage.local.get.resolves({
        bookmarkMindAnalytics: {
          version: '1.0',
          sessions: [],
          apiCalls: [],
          categoryUsage: {},
          apiByProvider: {},
          processingTimes: {},
          consolidations: new Array(50).fill({ foldersRemoved: 1, bookmarksMoved: 1 }),
          totalCategorizations: 0,
          totalErrors: 0,
          totalApiCalls: 0,
          successfulApiCalls: 0,
          failedApiCalls: 0,
          totalFoldersConsolidated: 50,
          totalBookmarksReorganized: 50
        }
      });

      await analyticsService.recordConsolidation({
        foldersProcessed: 1,
        bookmarksMoved: 1,
        foldersRemoved: 1
      });

      const analytics = await analyticsService._getAnalytics();
      expect(analytics.consolidations.length).toBe(50);
    });
  });

  describe('Analytics Report Generation', () => {
    test('should generate comprehensive analytics report', async () => {
      // Setup test data
      await analyticsService.recordCategorizationSession({
        processed: 100,
        categorized: 95,
        errors: 5,
        duration: 30000,
        categories: ['Work', 'Personal']
      });

      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        tokensUsed: 1000,
        responseTime: 2000
      });

      const report = await analyticsService.getAnalyticsReport();

      expect(report).toHaveProperty('overview');
      expect(report).toHaveProperty('recentActivity');
      expect(report).toHaveProperty('categoryStats');
      expect(report).toHaveProperty('apiStats');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('metadata');
    });

    test('should calculate overall success rate', async () => {
      await analyticsService.recordCategorizationSession({
        processed: 100,
        categorized: 90,
        errors: 10,
        duration: 10000,
        categories: []
      });

      const report = await analyticsService.getAnalyticsReport();

      expect(report.overview.overallSuccessRate).toBeGreaterThan(0);
      expect(report.overview.overallSuccessRate).toBeLessThanOrEqual(100);
    });

    test('should include recent activity metrics', async () => {
      await analyticsService.recordCategorizationSession({
        processed: 50,
        categorized: 48,
        errors: 2,
        duration: 15000,
        categories: ['Work']
      });

      const report = await analyticsService.getAnalyticsReport();

      expect(report.recentActivity).toHaveProperty('last24h');
      expect(report.recentActivity).toHaveProperty('last7d');
      expect(report.recentActivity).toHaveProperty('last30d');
    });

    test('should include top categories', async () => {
      await analyticsService.recordCategorizationSession({
        processed: 10,
        categorized: 10,
        errors: 0,
        duration: 5000,
        categories: ['Work', 'Work', 'Personal']
      });

      const report = await analyticsService.getAnalyticsReport();

      expect(report.categoryStats.topCategories.length).toBeGreaterThan(0);
      expect(report.categoryStats.topCategories[0].category).toBe('Work');
    });

    test('should calculate API stats by time period', async () => {
      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        tokensUsed: 1000,
        responseTime: 2000
      });

      const report = await analyticsService.getAnalyticsReport();

      expect(report.apiStats.recentCalls).toHaveProperty('last24h');
      expect(report.apiStats.recentCalls.last24h.total).toBeGreaterThan(0);
    });
  });

  describe('Performance Insights', () => {
    test('should generate performance insights', async () => {
      await analyticsService.recordCategorizationSession({
        processed: 50,
        categorized: 50,
        errors: 0,
        duration: 10000,
        categories: []
      });

      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        batchSize: 25,
        responseTime: 5000
      });

      const insights = await analyticsService.getPerformanceInsights();

      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('performanceMetrics');
      expect(insights).toHaveProperty('trends');
      expect(insights).toHaveProperty('warnings');
    });

    test('should recommend batch size optimization', async () => {
      // Record multiple small batch calls
      for (let i = 0; i < 5; i++) {
        await analyticsService.recordApiUsage({
          provider: 'gemini',
          success: true,
          batchSize: 10,
          responseTime: 2000
        });
      }

      const insights = await analyticsService.getPerformanceInsights();

      const batchRecommendation = insights.recommendations.find(
        r => r.type === 'batch_size'
      );

      expect(batchRecommendation).toBeTruthy();
    });

    test('should warn about high error rates', async () => {
      // Record mostly failed API calls
      for (let i = 0; i < 10; i++) {
        await analyticsService.recordApiUsage({
          provider: 'gemini',
          success: i > 7, // Only 2 successful
          responseTime: 1000
        });
      }

      const insights = await analyticsService.getPerformanceInsights();

      expect(insights.warnings.length).toBeGreaterThan(0);
      expect(insights.warnings[0].type).toBe('error_rate');
    });

    test('should compare provider performance', async () => {
      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        responseTime: 3000
      });

      await analyticsService.recordApiUsage({
        provider: 'cerebras',
        success: true,
        responseTime: 1500
      });

      const insights = await analyticsService.getPerformanceInsights();

      expect(insights.performanceMetrics.providerComparison).toBeTruthy();
      expect(Object.keys(insights.performanceMetrics.providerComparison).length).toBeGreaterThan(0);
    });

    test('should calculate batch efficiency metrics', async () => {
      await analyticsService.recordApiUsage({
        provider: 'gemini',
        success: true,
        batchSize: 50,
        responseTime: 5000
      });

      const insights = await analyticsService.getPerformanceInsights();

      expect(insights.performanceMetrics.batchEfficiency).toBeTruthy();
      expect(insights.performanceMetrics.batchEfficiency.avgBatchSize).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    test('should calculate success rate correctly', () => {
      expect(analyticsService._calculateSuccessRate(90, 100)).toBe(90);
      expect(analyticsService._calculateSuccessRate(100, 100)).toBe(100);
      expect(analyticsService._calculateSuccessRate(0, 100)).toBe(0);
      expect(analyticsService._calculateSuccessRate(50, 0)).toBe(0);
    });

    test('should calculate average time correctly', () => {
      expect(analyticsService._calculateAvgTime(10000, 50)).toBe(200);
      expect(analyticsService._calculateAvgTime(5000, 25)).toBe(200);
      expect(analyticsService._calculateAvgTime(1000, 0)).toBe(0);
    });

    test('should get top categories sorted by usage', () => {
      const categoryUsage = {
        'Work': 50,
        'Personal': 30,
        'Shopping': 20,
        'Entertainment': 10
      };

      const top3 = analyticsService._getTopCategories(categoryUsage, 3);

      expect(top3.length).toBe(3);
      expect(top3[0].category).toBe('Work');
      expect(top3[0].count).toBe(50);
      expect(top3[1].category).toBe('Personal');
      expect(top3[2].category).toBe('Shopping');
    });

    test('should filter session metrics by time range', () => {
      const now = Date.now();
      const sessions = [
        { timestamp: now - 1000, bookmarksProcessed: 10, bookmarksCategorized: 10, errors: 0, duration: 1000 },
        { timestamp: now - 25 * 60 * 60 * 1000, bookmarksProcessed: 20, bookmarksCategorized: 20, errors: 0, duration: 2000 }, // > 24h
        { timestamp: now - 2000, bookmarksProcessed: 15, bookmarksCategorized: 15, errors: 0, duration: 1500 }
      ];

      const last24h = now - 24 * 60 * 60 * 1000;
      const metrics = analyticsService._getSessionMetrics(sessions, last24h, now);

      expect(metrics.sessions).toBe(2); // Only 2 within 24h
      expect(metrics.bookmarksProcessed).toBe(25);
    });

    test('should filter API metrics by time range', () => {
      const now = Date.now();
      const apiCalls = [
        { timestamp: now - 1000, success: true, tokensUsed: 1000, responseTime: 2000 },
        { timestamp: now - 25 * 60 * 60 * 1000, success: true, tokensUsed: 1500, responseTime: 2500 }, // > 24h
        { timestamp: now - 2000, success: false, tokensUsed: 0, responseTime: 1000 }
      ];

      const last24h = now - 24 * 60 * 60 * 1000;
      const metrics = analyticsService._getApiMetrics(apiCalls, last24h, now);

      expect(metrics.total).toBe(2);
      expect(metrics.successful).toBe(1);
      expect(metrics.failed).toBe(1);
    });
  });

  describe('Data Export', () => {
    test('should export analytics data', async () => {
      await analyticsService.recordCategorizationSession({
        processed: 50,
        categorized: 45,
        errors: 5,
        duration: 10000,
        categories: ['Work']
      });

      const exported = await analyticsService.exportAnalytics();

      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('sessions');
      expect(exported).toHaveProperty('apiCalls');
      expect(exported).toHaveProperty('totalCategorizations');
    });

    test('should import analytics data', async () => {
      const importData = {
        version: '1.0',
        sessions: [{ processed: 10, categorized: 10 }],
        apiCalls: [],
        totalCategorizations: 10,
        totalErrors: 0
      };

      await analyticsService.importAnalytics(importData);

      const analytics = await analyticsService._getAnalytics();
      expect(analytics.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty analytics data', async () => {
      const report = await analyticsService.getAnalyticsReport();

      expect(report.overview.totalCategorizations).toBe(0);
      expect(report.sessions.length).toBe(0);
    });

    test('should handle missing session properties', async () => {
      await analyticsService.recordCategorizationSession({
        processed: 10
        // Missing other properties
      });

      const analytics = await analyticsService._getAnalytics();
      const lastSession = analytics.sessions[analytics.sessions.length - 1];

      expect(lastSession.categorized).toBe(0);
      expect(lastSession.errors).toBe(0);
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.rejects(new Error('Storage error'));

      const analytics = await analyticsService._getAnalytics();

      expect(analytics).toBeTruthy();
      expect(analytics.version).toBeTruthy();
    });

    test('should handle zero division in calculations', () => {
      expect(analyticsService._calculateSuccessRate(0, 0)).toBe(0);
      expect(analyticsService._calculateAvgTime(1000, 0)).toBe(0);
    });
  });
});
