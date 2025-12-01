import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Unit Tests - Options Controller
 * Tests for settings page functionality
 */

import fs from 'fs';
import path from 'path';
const { JSDOM } = require('jsdom');

// Load options HTML
const optionsHtml = fs.readFileSync(
  path.join(__dirname, '../extension/options/options.html'),
  'utf-8'
);

// Load options JS
const optionsSource = fs.readFileSync(
  path.join(__dirname, '../../../extension/features/settings/settings.js'),
  'utf-8'
);

describe('OptionsController', () => {
  let dom;
  let window;
  let document;
  let OptionsController;

  beforeEach(() => {
    // Create JSDOM instance with options HTML
    dom = new JSDOM(optionsHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'chrome-extension://test/options.html'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock chrome APIs
    chrome.runtime.sendMessage.resolves({ success: true, data: {} });
    chrome.storage.sync.get.resolves({
      bookmarkMindSettings: {
        apiKey: 'test_key',
        categories: ['Work', 'Personal'],
        batchSize: 50
      }
    });
    chrome.storage.sync.set.resolves();

    // Execute options script in JSDOM context
    const script = new window.Function(optionsSource);
    script.call(window);

    OptionsController = window.OptionsController;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      const controller = new OptionsController();
      expect(controller.settings).toEqual({});
      expect(controller.stats).toEqual({});
      expect(controller.isApiKeyVisible).toBe(false);
    });

    test('should initialize DOM element references', () => {
      const controller = new OptionsController();
      expect(controller.apiKeyInput).toBeTruthy();
      expect(controller.saveGeminiKeyBtn).toBeTruthy();
      expect(controller.categoriesList).toBeTruthy();
      expect(controller.batchSizeSelect).toBeTruthy();
    });

    test('should load settings on initialization', async () => {
      const mockSettings = {
        apiKey: 'test_api_key',
        categories: ['Work', 'Personal'],
        batchSize: 50
      };

      chrome.storage.sync.get.resolves({
        bookmarkMindSettings: mockSettings
      });

      const controller = new OptionsController();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(controller.settings).toEqual(mockSettings);
    });
  });

  describe('Settings Management', () => {
    test('should load settings from storage', async () => {
      const mockSettings = {
        apiKey: 'test_api_key',
        cerebrasApiKey: 'cerebras_key',
        groqApiKey: 'groq_key',
        categories: ['Work', 'Personal', 'Shopping'],
        batchSize: 75,
        cleanupEmptyFolders: true,
        maxCategoryDepth: 3,
        minBookmarksThreshold: 5
      };

      chrome.storage.sync.get.resolves({
        bookmarkMindSettings: mockSettings
      });

      const controller = new OptionsController();
      await controller.loadSettings();

      expect(controller.settings).toEqual(mockSettings);
    });

    test('should use default settings if none exist', async () => {
      chrome.storage.sync.get.resolves({});

      const controller = new OptionsController();
      await controller.loadSettings();

      const defaultSettings = controller.getDefaultSettings();
      expect(controller.settings).toEqual(defaultSettings);
    });

    test('should save settings to storage', async () => {
      const controller = new OptionsController();
      controller.settings = {
        apiKey: 'new_key',
        categories: ['Work'],
        batchSize: 100
      };

      await controller.saveSettings();

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        bookmarkMindSettings: controller.settings
      });
    });

    test('should show toast notification after saving', async () => {
      const controller = new OptionsController();
      const showToastSpy = jest.spyOn(controller, 'showToast');
      controller.settings = { apiKey: 'test_key' };

      await controller.saveSettings();

      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('saved'),
        'success'
      );
    });
  });

  describe('API Key Management', () => {
    test('should display masked API key when key exists', async () => {
      const controller = new OptionsController();
      controller.settings = { apiKey: 'test_api_key_12345' };

      controller.updateSettingsUI();

      expect(controller.apiKeyInput.value).toContain('••••');
      expect(controller.apiKeyInput.type).toBe('password');
      expect(controller.apiKeyInput.dataset.hasKey).toBe('true');
    });

    test('should toggle API key visibility', () => {
      const controller = new OptionsController();
      controller.settings = { apiKey: 'test_api_key' };
      controller.apiKeyInput.value = '••••••••';
      controller.isApiKeyVisible = false;

      controller.toggleApiKeyVisibility();

      expect(controller.isApiKeyVisible).toBe(true);
    });

    test('should clear API key', async () => {
      const controller = new OptionsController();
      controller.settings = { apiKey: 'test_api_key' };

      global.confirm = jest.fn(() => true);

      await controller.clearApiKey();

      expect(controller.settings.apiKey).toBe('');
      expect(controller.apiKeyInput.value).toBe('');
    });

    test('should not clear API key if user cancels', async () => {
      const controller = new OptionsController();
      controller.settings = { apiKey: 'test_api_key' };

      global.confirm = jest.fn(() => false);

      await controller.clearApiKey();

      expect(controller.settings.apiKey).toBe('test_api_key');
    });

    test('should test Gemini API key', async () => {
      const controller = new OptionsController();
      controller.apiKeyInput.value = 'test_api_key';

      global.mockFetch({
        candidates: [{ content: { parts: [{ text: 'success' }] } }]
      });

      await controller.testGeminiKey();

      expect(controller.apiKeyStatus.textContent).toContain('valid');
    });

    test('should handle API key test failure', async () => {
      const controller = new OptionsController();
      controller.apiKeyInput.value = 'invalid_key';

      global.mockFetch({ error: { message: 'Invalid API key' } }, 401);

      await controller.testGeminiKey();

      expect(controller.apiKeyStatus.textContent).toContain('invalid');
    });

    test('should save Gemini API key', async () => {
      const controller = new OptionsController();
      controller.apiKeyInput.value = 'new_gemini_key';
      controller.settings = {};

      await controller.saveGeminiKey();

      expect(controller.settings.apiKey).toBe('new_gemini_key');
      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });
  });

  describe('Categories Management', () => {
    test('should render categories list', () => {
      const controller = new OptionsController();
      controller.settings = {
        categories: ['Work', 'Personal', 'Shopping']
      };

      controller.renderCategories();

      const categoryItems = controller.categoriesList.querySelectorAll('.category-item');
      expect(categoryItems.length).toBe(3);
    });

    test('should add new category', async () => {
      const controller = new OptionsController();
      controller.settings = { categories: ['Work'] };
      controller.newCategoryInput.value = 'New Category';

      await controller.addCategory();

      expect(controller.settings.categories).toContain('New Category');
      expect(controller.newCategoryInput.value).toBe('');
    });

    test('should not add duplicate category', async () => {
      const controller = new OptionsController();
      controller.settings = { categories: ['Work', 'Personal'] };
      controller.newCategoryInput.value = 'Work';

      const showToastSpy = jest.spyOn(controller, 'showToast');

      await controller.addCategory();

      expect(controller.settings.categories.length).toBe(2);
      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('exists'),
        'warning'
      );
    });

    test('should not add empty category', async () => {
      const controller = new OptionsController();
      controller.settings = { categories: ['Work'] };
      controller.newCategoryInput.value = '   ';

      await controller.addCategory();

      expect(controller.settings.categories.length).toBe(1);
    });

    test('should remove category', async () => {
      const controller = new OptionsController();
      controller.settings = { categories: ['Work', 'Personal', 'Shopping'] };

      global.confirm = jest.fn(() => true);

      await controller.removeCategory('Personal');

      expect(controller.settings.categories).toEqual(['Work', 'Shopping']);
    });

    test('should not remove category if user cancels', async () => {
      const controller = new OptionsController();
      controller.settings = { categories: ['Work', 'Personal'] };

      global.confirm = jest.fn(() => false);

      await controller.removeCategory('Personal');

      expect(controller.settings.categories).toEqual(['Work', 'Personal']);
    });
  });

  describe('Advanced Settings', () => {
    test('should update batch size', async () => {
      const controller = new OptionsController();
      controller.settings = { batchSize: 50 };
      controller.batchSizeSelect.value = '100';

      await controller.saveSettings();

      expect(controller.settings.batchSize).toBe('100');
    });

    test('should update cleanup empty folders setting', async () => {
      const controller = new OptionsController();
      controller.settings = { cleanupEmptyFolders: false };
      controller.cleanupEmptyFoldersCheckbox.checked = true;

      await controller.saveSettings();

      expect(controller.settings.cleanupEmptyFolders).toBe(true);
    });

    test('should update max category depth', () => {
      const controller = new OptionsController();
      controller.maxCategoryDepthSlider.value = '4';

      controller.onMaxDepthChange();

      expect(controller.maxDepthValueDisplay.textContent).toBe('4');
    });

    test('should update min bookmarks threshold', () => {
      const controller = new OptionsController();
      controller.minBookmarksThresholdSlider.value = '7';

      controller.onMinThresholdChange();

      expect(controller.minThresholdValueDisplay.textContent).toBe('7');
    });
  });

  describe('Statistics Display', () => {
    test('should load and display stats', async () => {
      const mockStats = {
        totalBookmarks: 500,
        uncategorized: 50,
        categories: 25,
        learningPatterns: 100,
        lastSortTime: Date.now()
      };

      chrome.runtime.sendMessage.resolves({
        success: true,
        data: mockStats
      });

      const controller = new OptionsController();
      await controller.loadStats();

      expect(controller.stats).toEqual(mockStats);
    });

    test('should update stats UI', () => {
      const controller = new OptionsController();
      controller.stats = {
        totalBookmarks: 300,
        uncategorized: 25,
        categories: 15,
        learningPatterns: 50,
        lastSortTime: Date.now()
      };

      controller.updateStatsUI();

      expect(controller.totalBookmarksCount.textContent).toBe('300');
      expect(controller.organizedBookmarksCount.textContent).toBe('275');
      expect(controller.categoriesCount.textContent).toBe('15');
      expect(controller.learningPatternsCount.textContent).toBe('50');
    });

    test('should format last sort time', () => {
      const controller = new OptionsController();
      const sortTime = new Date('2024-01-01T12:00:00Z');
      controller.stats = {
        totalBookmarks: 100,
        lastSortTime: sortTime.getTime()
      };

      controller.updateStatsUI();

      expect(controller.lastSortDate.textContent).toBeTruthy();
    });

    test('should show "Never" when no last sort time', () => {
      const controller = new OptionsController();
      controller.stats = { totalBookmarks: 100 };

      controller.updateStatsUI();

      expect(controller.lastSortDate.textContent).toBe('Never');
    });
  });

  describe('Learning Data Management', () => {
    test('should load learning statistics', async () => {
      const mockLearningStats = {
        totalPatterns: 150,
        lastUpdated: Date.now(),
        patternsByType: {
          title: 50,
          url: 75,
          domain: 25
        }
      };

      chrome.runtime.sendMessage.resolves({
        success: true,
        data: mockLearningStats
      });

      const controller = new OptionsController();
      await controller.loadLearningData();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getLearningStatistics'
      });
    });

    test('should handle learning data load failure', async () => {
      chrome.runtime.sendMessage.rejects(new Error('Load failed'));

      const controller = new OptionsController();
      const showToastSpy = jest.spyOn(controller, 'showToast');

      await controller.loadLearningData();

      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed'),
        'error'
      );
    });

    test('should display learning patterns', () => {
      const controller = new OptionsController();
      const stats = {
        totalPatterns: 10,
        lastUpdated: Date.now(),
        topPatterns: [
          { pattern: 'github.com', category: 'Development', count: 5 }
        ]
      };

      controller.displayLearningStatistics(stats);

      expect(controller.totalLearningPatterns.textContent).toBe('10');
    });

    test('should clear learning data', async () => {
      const controller = new OptionsController();
      
      global.confirm = jest.fn(() => true);
      chrome.runtime.sendMessage.resolves({ success: true });

      await controller.clearLearningData();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'clearLearningData'
      });
    });
  });

  describe('Performance Monitoring', () => {
    test('should load performance data', async () => {
      const mockPerfData = {
        avgCategorizationTime: 1500,
        successRate: 95,
        totalApiCalls: 1000,
        memoryUsage: { usedMB: 50, totalMB: 100 }
      };

      chrome.runtime.sendMessage.resolves({
        success: true,
        data: mockPerfData
      });

      const controller = new OptionsController();
      await controller.loadPerformanceData();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getPerformanceDashboard'
      });
    });

    test('should set date range for last 30 days', () => {
      const controller = new OptionsController();

      controller.setDateRangeLast30Days();

      const startDate = new Date(controller.exportStartDate.value);
      const endDate = new Date(controller.exportEndDate.value);
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeCloseTo(30, 0);
    });

    test('should export performance report as JSON', async () => {
      const controller = new OptionsController();
      
      global.mockFetch({ data: 'report' });
      
      const createObjectURLSpy = jest.spyOn(global.URL, 'createObjectURL');
      const revokeObjectURLSpy = jest.spyOn(global.URL, 'revokeObjectURL');

      await controller.exportReport('json');

      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('Data Management', () => {
    test('should export all data', async () => {
      const controller = new OptionsController();
      
      const mockData = {
        settings: controller.settings,
        stats: controller.stats,
        timestamp: Date.now()
      };

      chrome.runtime.sendMessage.resolves({
        success: true,
        data: mockData
      });

      await controller.exportAllData();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'exportAllData'
      });
    });

    test('should consolidate folders', async () => {
      const controller = new OptionsController();
      
      global.confirm = jest.fn(() => true);
      chrome.runtime.sendMessage.resolves({
        success: true,
        data: { consolidated: 10 }
      });

      await controller.consolidateFolders();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'consolidateFolders'
      });
    });

    test('should reset settings', async () => {
      const controller = new OptionsController();
      
      global.confirm = jest.fn(() => true);

      await controller.resetSettings();

      const defaultSettings = controller.getDefaultSettings();
      expect(controller.settings).toEqual(defaultSettings);
    });

    test('should not reset settings if user cancels', async () => {
      const controller = new OptionsController();
      const originalSettings = { apiKey: 'test', categories: ['Work'] };
      controller.settings = originalSettings;

      global.confirm = jest.fn(() => false);

      await controller.resetSettings();

      expect(controller.settings).toEqual(originalSettings);
    });
  });

  describe('Toast Notifications', () => {
    test('should show toast notification', () => {
      const controller = new OptionsController();

      controller.showToast('Test message', 'success');

      expect(controller.toast.classList.contains('show')).toBe(true);
      expect(controller.toast.textContent).toContain('Test message');
      expect(controller.toast.classList.contains('success')).toBe(true);
    });

    test('should hide toast after timeout', (done) => {
      const controller = new OptionsController();

      controller.showToast('Test message', 'success');

      setTimeout(() => {
        expect(controller.toast.classList.contains('show')).toBe(false);
        done();
      }, 3500);
    });

    test('should show different toast types', () => {
      const controller = new OptionsController();

      controller.showToast('Error', 'error');
      expect(controller.toast.classList.contains('error')).toBe(true);

      controller.showToast('Warning', 'warning');
      expect(controller.toast.classList.contains('warning')).toBe(true);

      controller.showToast('Info', 'info');
      expect(controller.toast.classList.contains('info')).toBe(true);
    });
  });

  describe('Button State Management', () => {
    test('should update Gemini button states when key changes', () => {
      const controller = new OptionsController();
      controller.apiKeyInput.value = 'new_key';

      controller.onApiKeyChange();

      expect(controller.saveGeminiKeyBtn.disabled).toBe(false);
      expect(controller.testGeminiKeyBtn.disabled).toBe(false);
    });

    test('should update Cerebras button states when key changes', () => {
      const controller = new OptionsController();
      controller.cerebrasApiKeyInput.value = 'new_cerebras_key';

      controller.onCerebrasApiKeyChange();

      expect(controller.saveCerebrasKeyBtn.disabled).toBe(false);
      expect(controller.testCerebrasKeyBtn.disabled).toBe(false);
    });

    test('should update Groq button states when key changes', () => {
      const controller = new OptionsController();
      controller.groqApiKeyInput.value = 'new_groq_key';

      controller.onGroqApiKeyChange();

      expect(controller.saveGroqKeyBtn.disabled).toBe(false);
      expect(controller.testGroqKeyBtn.disabled).toBe(false);
    });

    test('should update add category button state', () => {
      const controller = new OptionsController();
      controller.newCategoryInput.value = 'New Category';

      controller.onNewCategoryChange();

      expect(controller.addCategoryBtn.disabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing HTML elements gracefully', () => {
      const controller = new OptionsController();
      controller.apiKeyInput = null;

      expect(() => controller.updateSettingsUI()).not.toThrow();
    });

    test('should handle storage errors gracefully', async () => {
      chrome.storage.sync.set.rejects(new Error('Storage quota exceeded'));

      const controller = new OptionsController();
      const showToastSpy = jest.spyOn(controller, 'showToast');
      controller.settings = { apiKey: 'test' };

      await controller.saveSettings();

      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed'),
        'error'
      );
    });

    test('should handle undefined settings values', () => {
      const controller = new OptionsController();
      controller.settings = { categories: undefined };

      expect(() => controller.renderCategories()).not.toThrow();
    });

    test('should trim whitespace from API keys', async () => {
      const controller = new OptionsController();
      controller.apiKeyInput.value = '  test_key_with_spaces  ';

      await controller.saveGeminiKey();

      expect(controller.settings.apiKey).toBe('test_key_with_spaces');
    });

    test('should handle runtime message errors', async () => {
      chrome.runtime.sendMessage.rejects(new Error('Extension context invalidated'));

      const controller = new OptionsController();
      await controller.loadStats();

      // Should not throw error
      expect(controller.stats).toBeDefined();
    });
  });

  describe('Message Listeners', () => {
    test('should handle learning data update messages', () => {
      const controller = new OptionsController();
      const loadSpy = jest.spyOn(controller, 'loadLearningData');

      const message = {
        type: 'LEARNING_DATA_UPDATED',
        count: 5
      };

      chrome.runtime.onMessage.addListener.yield(message);

      expect(loadSpy).toHaveBeenCalled();
    });

    test('should show toast on learning data update', () => {
      const controller = new OptionsController();
      const showToastSpy = jest.spyOn(controller, 'showToast');

      const message = {
        type: 'LEARNING_DATA_UPDATED',
        count: 3
      };

      chrome.runtime.onMessage.addListener.yield(message);

      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('3'),
        'success'
      );
    });
  });
});
