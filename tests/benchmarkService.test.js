/**
 * Unit Tests - Benchmark Service
 * Tests for benchmark suite and automated evaluation
 */

const fs = require('fs');
const path = require('path');

// Load source files
const benchmarkServiceSource = fs.readFileSync(
  path.join(__dirname, '../extension/scripts/benchmarkService.js'),
  'utf-8'
);

const aiProcessorSource = fs.readFileSync(
  path.join(__dirname, '../extension/scripts/aiProcessor.js'),
  'utf-8'
);

// Execute in global context
eval(aiProcessorSource);
eval(benchmarkServiceSource);

describe('BenchmarkService', () => {
  let benchmarkService;

  beforeEach(() => {
    benchmarkService = new BenchmarkService();
    chrome.storage.local.get.resolves({});
    chrome.storage.local.set.resolves();
    chrome.storage.sync.get.resolves({
      apiKey: 'test_key',
      cerebrasApiKey: 'cerebras_key',
      groqApiKey: 'groq_key'
    });

    global.fetch = jest.fn();
  });

  describe('Initialization', () => {
    test('should initialize with test sets', () => {
      expect(benchmarkService.testSets).toBeTruthy();
      expect(benchmarkService.testSets.technical).toBeTruthy();
      expect(benchmarkService.testSets.news).toBeTruthy();
      expect(benchmarkService.testSets.shopping).toBeTruthy();
      expect(benchmarkService.testSets.entertainment).toBeTruthy();
    });

    test('should initialize empty results array', () => {
      expect(benchmarkService.results).toEqual([]);
    });

    test('should have correct test set structure', () => {
      const technicalTests = benchmarkService.testSets.technical;
      
      expect(Array.isArray(technicalTests)).toBe(true);
      expect(technicalTests.length).toBeGreaterThan(0);
      expect(technicalTests[0]).toHaveProperty('title');
      expect(technicalTests[0]).toHaveProperty('url');
      expect(technicalTests[0]).toHaveProperty('expectedCategory');
    });
  });

  describe('Test Sets', () => {
    test('should have technical bookmarks', () => {
      const technical = benchmarkService.testSets.technical;
      
      expect(technical.length).toBeGreaterThan(0);
      expect(technical.some(t => t.url.includes('react.dev'))).toBe(true);
      expect(technical.some(t => t.url.includes('github.com'))).toBe(true);
    });

    test('should have news bookmarks', () => {
      const news = benchmarkService.testSets.news;
      
      expect(news.length).toBeGreaterThan(0);
      expect(news.some(t => t.url.includes('techcrunch.com'))).toBe(true);
    });

    test('should have shopping bookmarks', () => {
      const shopping = benchmarkService.testSets.shopping;
      
      expect(shopping.length).toBeGreaterThan(0);
      expect(shopping.some(t => t.url.includes('amazon.com'))).toBe(true);
    });

    test('should have entertainment bookmarks', () => {
      const entertainment = benchmarkService.testSets.entertainment;
      
      expect(entertainment.length).toBeGreaterThan(0);
      expect(entertainment.some(t => t.url.includes('netflix.com'))).toBe(true);
    });
  });

  describe('Prediction Evaluation', () => {
    test('should evaluate exact match as correct', () => {
      const result = benchmarkService._evaluatePrediction(
        'Development > Frontend',
        'Development > Frontend'
      );
      
      expect(result).toBe('correct');
    });

    test('should evaluate partial match when parent matches', () => {
      const result = benchmarkService._evaluatePrediction(
        'Development > Backend',
        'Development > Frontend'
      );
      
      expect(result).toBe('partial');
    });

    test('should evaluate as incorrect when no match', () => {
      const result = benchmarkService._evaluatePrediction(
        'News > Technology',
        'Development > Frontend'
      );
      
      expect(result).toBe('incorrect');
    });

    test('should handle null or empty predictions', () => {
      expect(benchmarkService._evaluatePrediction(null, 'Development')).toBe('incorrect');
      expect(benchmarkService._evaluatePrediction('', 'Development')).toBe('incorrect');
      expect(benchmarkService._evaluatePrediction('Development', null)).toBe('incorrect');
    });
  });

  describe('Folder Consistency', () => {
    test('should calculate consistency score', () => {
      const categoryResults = {
        technical: {
          predictions: [
            { predicted: 'Development > Frontend' },
            { predicted: 'Development > Backend' },
            { predicted: 'Development > Tools' },
            { predicted: 'News > Technology' } // Different parent
          ]
        }
      };

      const score = benchmarkService._evaluateFolderConsistency(categoryResults);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should return 1.0 for perfect consistency', () => {
      const categoryResults = {
        technical: {
          predictions: [
            { predicted: 'Development > Frontend' },
            { predicted: 'Development > Backend' },
            { predicted: 'Development > Tools' }
          ]
        }
      };

      const score = benchmarkService._evaluateFolderConsistency(categoryResults);
      
      expect(score).toBe(1.0);
    });

    test('should handle empty predictions', () => {
      const categoryResults = {
        technical: {
          predictions: []
        }
      };

      const score = benchmarkService._evaluateFolderConsistency(categoryResults);
      
      expect(score).toBe(1.0);
    });
  });

  describe('Cost Calculation', () => {
    test('should calculate batch cost', () => {
      const batch = [
        { title: 'React Documentation', url: 'https://react.dev' },
        { title: 'Node.js Guide', url: 'https://nodejs.org' }
      ];

      const results = [
        { category: 'Development > Frontend', reasoning: 'React framework' },
        { category: 'Development > Backend', reasoning: 'Node.js runtime' }
      ];

      const model = {
        name: 'gemini-2.5-pro',
        costPer1MInputTokens: 3.50,
        costPer1MOutputTokens: 10.50
      };

      const cost = benchmarkService._calculateBatchCost(batch, results, model);
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be small for 2 bookmarks
    });

    test('should handle empty batches', () => {
      const cost = benchmarkService._calculateBatchCost([], [], {
        costPer1MInputTokens: 3.50,
        costPer1MOutputTokens: 10.50
      });
      
      expect(cost).toBe(0);
    });
  });

  describe('Model Selection', () => {
    test('should get models for Gemini provider', () => {
      const aiProcessor = new AIProcessor();
      const models = benchmarkService._getModelsForProvider('gemini', aiProcessor);
      
      expect(models.length).toBeGreaterThan(0);
      expect(models.length).toBeLessThanOrEqual(3); // Top 3
      expect(models[0]).toHaveProperty('name');
    });

    test('should get models for Cerebras provider', () => {
      const aiProcessor = new AIProcessor();
      const models = benchmarkService._getModelsForProvider('cerebras', aiProcessor);
      
      expect(models.length).toBeGreaterThan(0);
    });

    test('should get models for Groq provider', () => {
      const aiProcessor = new AIProcessor();
      const models = benchmarkService._getModelsForProvider('groq', aiProcessor);
      
      expect(models.length).toBeGreaterThan(0);
    });

    test('should filter by specific models', () => {
      const aiProcessor = new AIProcessor();
      const specificModels = ['gemini-2.5-pro'];
      const models = benchmarkService._getModelsForProvider('gemini', aiProcessor, specificModels);
      
      expect(models.length).toBe(1);
      expect(models[0].name).toBe('gemini-2.5-pro');
    });

    test('should return empty array for unknown provider', () => {
      const aiProcessor = new AIProcessor();
      const models = benchmarkService._getModelsForProvider('unknown', aiProcessor);
      
      expect(models.length).toBe(0);
    });
  });

  describe('Average Calculations', () => {
    test('should calculate average accuracy', () => {
      const providers = [
        { successRate: 90, error: undefined },
        { successRate: 85, error: undefined },
        { successRate: 95, error: undefined }
      ];

      const avg = benchmarkService._calculateAverageAccuracy(providers);
      
      expect(avg).toBe(90);
    });

    test('should ignore providers with errors', () => {
      const providers = [
        { successRate: 90, error: undefined },
        { error: 'API error' },
        { successRate: 80, error: undefined }
      ];

      const avg = benchmarkService._calculateAverageAccuracy(providers);
      
      expect(avg).toBe(85);
    });

    test('should return 0 for empty providers', () => {
      const avg = benchmarkService._calculateAverageAccuracy([]);
      
      expect(avg).toBe(0);
    });

    test('should calculate average speed', () => {
      const providers = [
        { averageSpeed: 2000, error: undefined },
        { averageSpeed: 1500, error: undefined },
        { averageSpeed: 2500, error: undefined }
      ];

      const avg = benchmarkService._calculateAverageSpeed(providers);
      
      expect(avg).toBe(2000);
    });
  });

  describe('Settings Management', () => {
    test('should get user settings', async () => {
      const settings = await benchmarkService._getSettings();
      
      expect(settings).toHaveProperty('apiKey');
      expect(settings.apiKey).toBe('test_key');
    });

    test('should handle missing settings', async () => {
      chrome.storage.sync.get.resolves({});

      const settings = await benchmarkService._getSettings();
      
      expect(settings).toEqual({});
    });
  });

  describe('Results Storage', () => {
    test('should save benchmark results', async () => {
      const results = {
        timestamp: Date.now(),
        providers: [],
        summary: {
          totalTests: 100,
          totalDuration: 60000,
          averageAccuracy: 90,
          averageSpeed: 2000
        }
      };

      await benchmarkService._saveResults(results);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        benchmarkHistory: expect.arrayContaining([
          expect.objectContaining({
            ...results,
            id: expect.stringContaining('benchmark_')
          })
        ])
      });
    });

    test('should limit history to 50 results', async () => {
      const existingHistory = Array.from({ length: 50 }, (_, i) => ({
        id: `benchmark_${i}`,
        timestamp: Date.now() - i * 1000
      }));

      chrome.storage.local.get.resolves({ benchmarkHistory: existingHistory });

      await benchmarkService._saveResults({
        timestamp: Date.now(),
        providers: [],
        summary: {}
      });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.benchmarkHistory.length).toBe(50);
    });

    test('should get benchmark history', async () => {
      const mockHistory = [
        { id: 'benchmark_1', timestamp: Date.now() },
        { id: 'benchmark_2', timestamp: Date.now() - 1000 }
      ];

      chrome.storage.local.get.resolves({ benchmarkHistory: mockHistory });

      const history = await benchmarkService.getHistory(10);
      
      expect(history).toEqual(mockHistory);
    });

    test('should limit history retrieval', async () => {
      const mockHistory = Array.from({ length: 20 }, (_, i) => ({
        id: `benchmark_${i}`,
        timestamp: Date.now() - i * 1000
      }));

      chrome.storage.local.get.resolves({ benchmarkHistory: mockHistory });

      const history = await benchmarkService.getHistory(5);
      
      expect(history.length).toBe(5);
    });

    test('should return empty array if no history', async () => {
      chrome.storage.local.get.resolves({});

      const history = await benchmarkService.getHistory();
      
      expect(history).toEqual([]);
    });
  });

  describe('Performance Report', () => {
    test('should generate performance report', () => {
      const results = {
        timestamp: Date.now(),
        providers: [
          {
            provider: 'gemini',
            successRate: 90,
            averageSpeed: 2000,
            totalCost: 0.05,
            models: [
              { modelName: 'gemini-2.5-pro', successRate: 92, averageSpeed: 1800 }
            ]
          }
        ],
        summary: {
          totalTests: 100,
          totalDuration: 60000,
          averageAccuracy: 90,
          averageSpeed: 2000,
          totalCost: 0.05
        }
      };

      const report = benchmarkService.generateReport(results);
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('date');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('bestModel');
      expect(report).toHaveProperty('comparison');
    });
  });

  describe('Batch Categorization', () => {
    test('should categorize batch of test bookmarks', async () => {
      global.mockFetch({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                categories: ['Development'],
                results: [
                  { bookmarkId: 'b1', category: 'Development > Frontend' }
                ]
              })
            }]
          }
        }]
      });

      const batch = [
        { title: 'React Docs', url: 'https://react.dev', expectedCategory: 'Development > Frontend' }
      ];

      const aiProcessor = new AIProcessor();
      aiProcessor.setApiKey('test_key');

      const results = await benchmarkService._categorizeBatch(
        aiProcessor,
        batch,
        'gemini',
        { name: 'gemini-2.5-pro' }
      );
      
      expect(results).toBeTruthy();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle categorization errors', async () => {
      global.mockFetch({ error: { message: 'API error' } }, 500);

      const batch = [
        { title: 'Test', url: 'https://test.com', expectedCategory: 'Other' }
      ];

      const aiProcessor = new AIProcessor();
      aiProcessor.setApiKey('test_key');

      const results = await benchmarkService._categorizeBatch(
        aiProcessor,
        batch,
        'gemini',
        { name: 'gemini-2.5-pro' }
      );
      
      expect(results).toBeTruthy();
      expect(results[0].category).toBe('Other');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty test categories', async () => {
      const results = await benchmarkService.runBenchmarkSuite({
        providers: ['gemini'],
        testCategories: []
      });
      
      expect(results).toBeTruthy();
      expect(results.providers.length).toBeGreaterThan(0);
    });

    test('should handle provider errors', async () => {
      chrome.storage.sync.get.resolves({}); // No API keys

      const results = await benchmarkService.runBenchmarkSuite({
        providers: ['gemini'],
        testCategories: ['technical']
      });
      
      expect(results.providers[0]).toHaveProperty('error');
    });

    test('should handle storage errors', async () => {
      chrome.storage.local.set.rejects(new Error('Storage error'));

      const results = {
        timestamp: Date.now(),
        providers: [],
        summary: {}
      };

      // Should not throw
      await expect(benchmarkService._saveResults(results)).resolves.not.toThrow();
    });

    test('should handle missing test set', () => {
      const results = benchmarkService.testSets.nonexistent;
      
      expect(results).toBeUndefined();
    });

    test('should handle null predictions in consistency calculation', () => {
      const categoryResults = {
        technical: {
          predictions: [
            { predicted: null },
            { predicted: 'Development' },
            { predicted: undefined }
          ]
        }
      };

      const score = benchmarkService._evaluateFolderConsistency(categoryResults);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration Tests', () => {
    test('should complete benchmark workflow', async () => {
      global.mockFetch({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                categories: ['Development'],
                results: [{ bookmarkId: 'b1', category: 'Development' }]
              })
            }]
          }
        }]
      });

      const results = await benchmarkService.runBenchmarkSuite({
        providers: ['gemini'],
        testCategories: ['technical'],
        batchSize: 5
      });
      
      expect(results).toBeTruthy();
      expect(results.summary).toBeTruthy();
      expect(results.providers.length).toBeGreaterThan(0);
    });

    test('should save results after benchmark', async () => {
      global.mockFetch({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                categories: [],
                results: []
              })
            }]
          }
        }]
      });

      await benchmarkService.runBenchmarkSuite({
        providers: ['gemini'],
        testCategories: ['technical'],
        batchSize: 5
      });
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });
});
