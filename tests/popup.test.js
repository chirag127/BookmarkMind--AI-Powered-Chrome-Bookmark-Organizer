/**
 * Unit Tests - Popup Controller
 * Tests for popup UI component functionality
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load popup HTML
const popupHtml = fs.readFileSync(
  path.join(__dirname, '../extension/popup/popup.html'),
  'utf-8'
);

// Load popup JS
const popupSource = fs.readFileSync(
  path.join(__dirname, '../extension/popup/popup.js'),
  'utf-8'
);

describe('PopupController', () => {
  let dom;
  let window;
  let document;
  let PopupController;

  beforeEach(() => {
    // Create JSDOM instance with popup HTML
    dom = new JSDOM(popupHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'chrome-extension://test/popup.html'
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
        lastSortTime: Date.now()
      }
    });

    // Execute popup script in JSDOM context
    const script = new window.Function(popupSource);
    script.call(window);

    PopupController = window.PopupController;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      const controller = new PopupController();
      expect(controller.isProcessing).toBe(false);
      expect(controller.settings).toBeNull();
      expect(controller.stats).toBeNull();
    });

    test('should initialize DOM element references', () => {
      const controller = new PopupController();
      expect(controller.sortBtn).toBeTruthy();
      expect(controller.bulkCategorizeBtn).toBeTruthy();
      expect(controller.viewSnapshotsBtn).toBeTruthy();
      expect(controller.settingsBtn).toBeTruthy();
    });

    test('should handle missing chrome APIs gracefully', () => {
      const originalChrome = global.chrome;
      global.chrome = undefined;

      const controller = new PopupController();
      const errorDiv = document.querySelector('[style*="padding: 20px"]');
      expect(errorDiv).toBeTruthy();

      global.chrome = originalChrome;
    });
  });

  describe('Settings Management', () => {
    test('should load settings from storage', async () => {
      const mockSettings = {
        apiKey: 'test_api_key',
        categories: ['Work', 'Personal'],
        batchSize: 50
      };

      chrome.storage.sync.get.resolves({
        bookmarkMindSettings: mockSettings
      });

      const controller = new PopupController();
      await controller.loadSettings();

      expect(controller.settings).toEqual(mockSettings);
    });

    test('should handle settings load failure gracefully', async () => {
      chrome.storage.sync.get.rejects(new Error('Storage error'));

      const controller = new PopupController();
      await controller.loadSettings();

      expect(controller.settings).toEqual({});
    });

    test('should initialize with empty settings if none exist', async () => {
      chrome.storage.sync.get.resolves({});

      const controller = new PopupController();
      await controller.loadSettings();

      expect(controller.settings).toEqual({});
    });
  });

  describe('Statistics Management', () => {
    test('should load stats successfully', async () => {
      const mockStats = {
        totalBookmarks: 150,
        uncategorized: 25,
        totalFolders: 10
      };

      chrome.runtime.sendMessage.resolves({
        success: true,
        data: mockStats
      });

      const controller = new PopupController();
      await controller.loadStats();

      expect(controller.stats).toEqual(mockStats);
    });

    test('should handle stats load failure', async () => {
      chrome.runtime.sendMessage.resolves({
        success: false,
        error: 'Failed to get stats'
      });

      const controller = new PopupController();
      await controller.loadStats();

      expect(controller.stats).toEqual({
        totalBookmarks: 0,
        uncategorized: 0,
        totalFolders: 0
      });
    });

    test('should fallback to direct bookmark access if stats are empty', async () => {
      chrome.runtime.sendMessage.resolves({
        success: true,
        data: { totalBookmarks: 0, uncategorized: 0 }
      });

      const mockTree = [{
        id: '0',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Test', url: 'https://test.com', parentId: '1' }
            ]
          }
        ]
      }];

      chrome.bookmarks.getTree.resolves(mockTree);

      const controller = new PopupController();
      await controller.loadInitialData();

      expect(controller.stats.totalBookmarks).toBe(1);
    });
  });

  describe('UI Updates', () => {
    test('should update UI with current stats', async () => {
      const controller = new PopupController();
      controller.stats = {
        totalBookmarks: 100,
        uncategorized: 20,
        totalFolders: 5
      };
      controller.settings = { apiKey: 'test_key' };

      controller.updateUI();

      expect(controller.totalBookmarks.textContent).toBe('100');
      expect(controller.uncategorized.textContent).toBe('20');
    });

    test('should show API key warning when key is missing', async () => {
      const controller = new PopupController();
      controller.settings = { apiKey: null };
      controller.stats = { totalBookmarks: 10, uncategorized: 5 };

      controller.updateUI();

      expect(controller.apiKeyWarning.classList.contains('hidden')).toBe(false);
      expect(controller.sortBtn.disabled).toBe(true);
    });

    test('should hide API key warning when key is present', async () => {
      const controller = new PopupController();
      controller.settings = { apiKey: 'test_key' };
      controller.stats = { totalBookmarks: 10, uncategorized: 5 };

      controller.updateUI();

      expect(controller.apiKeyWarning.classList.contains('hidden')).toBe(true);
      expect(controller.sortBtn.disabled).toBe(false);
    });

    test('should update sort button when all bookmarks are organized', async () => {
      const controller = new PopupController();
      controller.settings = { apiKey: 'test_key' };
      controller.stats = { totalBookmarks: 100, uncategorized: 0 };

      controller.updateUI();

      expect(controller.sortBtn.innerHTML).toContain('All Organized!');
      expect(controller.sortBtn.disabled).toBe(true);
    });

    test('should show uncategorized count in sort button', async () => {
      const controller = new PopupController();
      controller.settings = { apiKey: 'test_key' };
      controller.stats = { totalBookmarks: 100, uncategorized: 25 };

      controller.updateUI();

      expect(controller.sortBtn.innerHTML).toContain('Sort 25 Bookmarks');
      expect(controller.sortBtn.disabled).toBe(false);
    });
  });

  describe('Progress Tracking', () => {
    test('should update progress display', () => {
      const controller = new PopupController();
      
      controller.updateProgress('Processing bookmarks...', 50);

      expect(controller.progressText.textContent).toBe('Processing bookmarks...');
      expect(controller.progressPercent.textContent).toBe('50%');
      expect(controller.progressFill.style.width).toBe('50%');
    });

    test('should show progress section when categorization starts', () => {
      const controller = new PopupController();
      
      controller.showProgress();

      expect(controller.progressSection.classList.contains('hidden')).toBe(false);
      expect(controller.actionSection.classList.contains('hidden')).toBe(true);
    });

    test('should handle progress updates from background script', () => {
      const controller = new PopupController();
      const updateSpy = jest.spyOn(controller, 'updateProgress');

      // Simulate message from background script
      const message = {
        action: 'categorizationProgress',
        data: { text: 'Processing...', percent: 75 }
      };

      chrome.runtime.onMessage.addListener.yield(message);

      expect(updateSpy).toHaveBeenCalledWith(message.data);
    });
  });

  describe('Results Display', () => {
    test('should show results after successful categorization', () => {
      const controller = new PopupController();
      const results = {
        processed: 50,
        categorized: 45,
        errors: 5,
        message: 'Categorization complete!'
      };

      controller.showResults(results);

      expect(controller.resultsSection.classList.contains('hidden')).toBe(false);
      expect(controller.processedCount.textContent).toBe('50');
      expect(controller.categorizedCount.textContent).toBe('45');
    });

    test('should handle results with zero bookmarks', () => {
      const controller = new PopupController();
      const results = {
        processed: 0,
        categorized: 0,
        errors: 0,
        message: 'No bookmarks to process.'
      };

      controller.showResults(results);

      expect(controller.resultsSection.classList.contains('hidden')).toBe(false);
      expect(controller.resultsMessage.textContent).toContain('No bookmarks');
    });

    test('should show background start status title', () => {
      const controller = new PopupController();
      const results = {
        started: true,
        message: 'Categorization started in background'
      };

      controller.showResults(results);

      expect(controller.resultsTitle.textContent).toContain('Categorization Started');
      expect(controller.resultsMessage.textContent).toContain('Categorization started in background');
    });
  });

  describe('Error Handling', () => {
    test('should handle categorization errors', () => {
      const controller = new PopupController();
      const showErrorSpy = jest.spyOn(controller, 'showError');

      controller.handleCategorizationError({
        message: 'API error',
        code: 500
      });

      expect(showErrorSpy).toHaveBeenCalled();
    });

    test('should display error messages to user', () => {
      const controller = new PopupController();
      
      controller.showError('Test error message');

      // Error should be displayed in UI
      expect(controller.resultsSection.classList.contains('hidden')).toBe(false);
      expect(controller.resultsTitle.textContent).toContain('Error');
    });
  });

  describe('Bulk Selection', () => {
    test('should show bulk selection interface', () => {
      const controller = new PopupController();
      
      controller.showBulkSelection();

      expect(controller.bulkSelectionSection.classList.contains('hidden')).toBe(false);
      expect(controller.actionSection.classList.contains('hidden')).toBe(true);
    });

    test('should hide bulk selection interface', () => {
      const controller = new PopupController();
      
      controller.showBulkSelection();
      controller.hideBulkSelection();

      expect(controller.bulkSelectionSection.classList.contains('hidden')).toBe(true);
      expect(controller.actionSection.classList.contains('hidden')).toBe(false);
    });

    test('should update selected count', () => {
      const controller = new PopupController();
      
      controller.updateSelectedCount(5);

      expect(controller.selectedCount.textContent).toBe('5');
    });
  });

  describe('Snapshot Management', () => {
    test('should show snapshots section', () => {
      const controller = new PopupController();
      
      controller.showSnapshots();

      expect(controller.snapshotsSection.classList.contains('hidden')).toBe(false);
      expect(controller.actionSection.classList.contains('hidden')).toBe(true);
    });

    test('should hide snapshots section', () => {
      const controller = new PopupController();
      
      controller.showSnapshots();
      controller.hideSnapshots();

      expect(controller.snapshotsSection.classList.contains('hidden')).toBe(true);
      expect(controller.actionSection.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Time Formatting', () => {
    test('should format relative time correctly', () => {
      const controller = new PopupController();
      
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(controller.formatRelativeTime(oneDayAgo)).toContain('day');
      expect(controller.formatRelativeTime(oneWeekAgo)).toContain('week');
    });

    test('should handle very recent times', () => {
      const controller = new PopupController();
      const now = new Date();

      expect(controller.formatRelativeTime(now)).toContain('moment');
    });
  });

  describe('Navigation', () => {
    test('should open settings page', () => {
      const controller = new PopupController();
      const createTabSpy = jest.spyOn(chrome.tabs, 'create');

      controller.openSettings();

      expect(createTabSpy).toHaveBeenCalledWith({
        url: 'options/options.html'
      });
    });

    test('should open folder insights', () => {
      const controller = new PopupController();
      const createTabSpy = jest.spyOn(chrome.tabs, 'create');

      controller.openFolderInsights();

      expect(createTabSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('folderInsights.html')
        })
      );
    });
  });

  describe('Extension Status', () => {
    test('should update extension status indicator', () => {
      const controller = new PopupController();
      controller.settings = { apiKey: 'test_key' };
      controller.stats = { totalBookmarks: 100, uncategorized: 0 };

      controller.updateExtensionStatus();

      expect(controller.statusDot.classList.contains('status-active')).toBe(true);
    });

    test('should show warning status when API key is missing', () => {
      const controller = new PopupController();
      controller.settings = { apiKey: null };
      controller.stats = { totalBookmarks: 100, uncategorized: 50 };

      controller.updateExtensionStatus();

      expect(controller.statusDot.classList.contains('status-warning')).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    test('should attach event listeners on initialization', () => {
      const controller = new PopupController();

      expect(controller.sortBtn.onclick).toBeDefined();
      expect(controller.bulkCategorizeBtn.onclick).toBeDefined();
      expect(controller.viewSnapshotsBtn.onclick).toBeDefined();
      expect(controller.settingsBtn.onclick).toBeDefined();
    });

    test('should handle sort button click', async () => {
      const controller = new PopupController();
      controller.settings = { apiKey: 'test_key' };
      controller.stats = { totalBookmarks: 100, uncategorized: 25 };
      controller.isProcessing = false;

      const startCategorizationSpy = jest.spyOn(controller, 'startCategorization');

      controller.sortBtn.click();

      expect(startCategorizationSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined stats gracefully', () => {
      const controller = new PopupController();
      controller.settings = { apiKey: 'test_key' };
      controller.stats = undefined;

      expect(() => controller.updateUI()).not.toThrow();
    });

    test('should handle undefined settings gracefully', () => {
      const controller = new PopupController();
      controller.settings = undefined;
      controller.stats = { totalBookmarks: 100, uncategorized: 25 };

      expect(() => controller.updateUI()).not.toThrow();
    });

    test('should prevent multiple simultaneous operations', () => {
      const controller = new PopupController();
      controller.isProcessing = true;

      const result = controller.startCategorization();

      expect(result).toBeUndefined();
    });

    test('should handle chrome.runtime message errors', async () => {
      chrome.runtime.sendMessage.rejects(new Error('Connection error'));

      const controller = new PopupController();
      await controller.loadStats();

      expect(controller.stats.totalBookmarks).toBe(0);
    });
  });
});
