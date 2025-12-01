import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * End-to-End Tests - Complete Categorization Workflow
 * Tests the complete bookmark organization process
 */

import fs from 'fs';
import path from 'path';

// Load all required modules
const bookmarkServiceSource = fs.readFileSync(path.join(__dirname, '../../../extension/features/bookmarks/bookmarkService.js'), 'utf-8');
const folderManagerSource = fs.readFileSync(path.join(__dirname, '../../../extension/features/bookmarks/folderManager.js'), 'utf-8');
const aiProcessorSource = fs.readFileSync(path.join(__dirname, '../../../extension/features/ai/aiProcessor.js'), 'utf-8');

// Execute in global context
eval(bookmarkServiceSource);
eval(folderManagerSource);
eval(aiProcessorSource);

// Mock categorizer without background dependencies
class MockCategorizer {
  constructor() {
    this.bookmarkService = new BookmarkService();
    this.aiProcessor = new AIProcessor();
    this.folderManager = new FolderManager();
    this.isProcessing = false;
  }

  async initialize(settings) {
    if (settings.apiKey) {
      this.aiProcessor.setApiKey(settings.apiKey);
    }
  }

  async _getSettings() {
    return {
      apiKey: 'test_api_key',
      categories: ['Work', 'Personal', 'Shopping', 'Entertainment'],
      batchSize: 50
    };
  }

  async _getLearningData() {
    return {};
  }

  async _organizeBookmarks(categorizations, bookmarks) {
    const results = {
      success: 0,
      errors: 0,
      categoriesUsed: new Set()
    };

    for (const cat of categorizations) {
      try {
        const folderId = await this.bookmarkService.findOrCreateFolderByPath(cat.category, '1');
        await this.bookmarkService.moveBookmark(cat.bookmarkId, folderId);
        results.success++;
        results.categoriesUsed.add(cat.category);
      } catch (error) {
        results.errors++;
      }
    }

    return results;
  }
}

describe('End-to-End: Complete Bookmark Organization Workflow', () => {
  let categorizer;

  beforeEach(() => {
    categorizer = new MockCategorizer();
  });

  describe('Full Categorization Workflow', () => {
    test('should complete full workflow from bookmarks to organized folders', async () => {
      // Setup: Mock bookmarks in default folders
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'GitHub', url: 'https://github.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b2', title: 'Amazon', url: 'https://amazon.com', parentId: '1', dateAdded: Date.now() }
            ]
          },
          {
            id: '2',
            title: 'Other Bookmarks',
            children: [
              { id: 'b3', title: 'Netflix', url: 'https://netflix.com', parentId: '2', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      // Mock AI categorization response
      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work > Development', confidence: 0.9 },
        { bookmarkId: 'b2', category: 'Shopping', confidence: 0.85 },
        { bookmarkId: 'b3', category: 'Entertainment', confidence: 0.95 }
      ];

      // Step 1: Get all bookmarks
      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(3);

      // Step 2: Organize bookmarks based on categorization
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      // Verify results
      expect(results.success).toBe(3);
      expect(results.errors).toBe(0);
      expect(results.categoriesUsed.size).toBeGreaterThan(0);

      // Verify Chrome API calls
      expect(chrome.bookmarks.create.called).toBe(true);
      expect(chrome.bookmarks.move.callCount).toBe(3);
    });

    test('should handle hierarchical folder creation', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'React Docs', url: 'https://react.dev', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work > Development > Frontend > React', confidence: 0.9 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(1);
      // Should create multiple levels of folders
      expect(chrome.bookmarks.create.callCount).toBeGreaterThanOrEqual(4);
    });

    test('should reuse existing folders', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'f1', title: 'Work', children: [] },
              { id: 'b1', title: 'Bookmark 1', url: 'https://example1.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b2', title: 'Bookmark 2', url: 'https://example2.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren
        .withArgs('1').yields([{ id: 'f1', title: 'Work' }])
        .withArgs('f1').yields([]);

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work', confidence: 0.9 },
        { bookmarkId: 'b2', category: 'Work', confidence: 0.85 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(2);
      // Should not create 'Work' folder since it exists
      expect(chrome.bookmarks.create.called).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle bookmark move failures gracefully', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b2', title: 'Bookmark 2', url: 'https://test.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      // Simulate move failure for second bookmark
      chrome.bookmarks.move
        .onFirstCall().callsFake((id, dest, cb) => {
          if (cb) cb({ id, ...dest });
          return Promise.resolve({ id, ...dest });
        })
        .onSecondCall().throws(new Error('Move failed'));

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work', confidence: 0.9 },
        { bookmarkId: 'b2', category: 'Personal', confidence: 0.85 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(1);
      expect(results.errors).toBe(1);
    });

    test('should handle folder creation failures', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);
      chrome.bookmarks.create.throws(new Error('Folder creation failed'));

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work', confidence: 0.9 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.errors).toBe(1);
    });
  });

  describe('Statistics and Tracking', () => {
    test('should track categories used', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example1.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b2', title: 'Bookmark 2', url: 'https://example2.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b3', title: 'Bookmark 3', url: 'https://example3.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work', confidence: 0.9 },
        { bookmarkId: 'b2', category: 'Work', confidence: 0.85 },
        { bookmarkId: 'b3', category: 'Personal', confidence: 0.8 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.categoriesUsed.size).toBe(2);
      expect(results.categoriesUsed.has('Work')).toBe(true);
      expect(results.categoriesUsed.has('Personal')).toBe(true);
    });

    test('should calculate correct success/error counts', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example1.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b2', title: 'Bookmark 2', url: 'https://example2.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b3', title: 'Bookmark 3', url: 'https://example3.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      // Simulate 2 successes, 1 failure
      let callCount = 0;
      chrome.bookmarks.move.callsFake((id, dest, cb) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Move failed');
        }
        if (cb) cb({ id, ...dest });
        return Promise.resolve({ id, ...dest });
      });

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work', confidence: 0.9 },
        { bookmarkId: 'b2', category: 'Personal', confidence: 0.85 },
        { bookmarkId: 'b3', category: 'Shopping', confidence: 0.8 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(2);
      expect(results.errors).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty bookmarks list', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          { id: '1', title: 'Bookmarks Bar', children: [] }
        ]
      }]);

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks([], bookmarks);

      expect(results.success).toBe(0);
      expect(results.errors).toBe(0);
    });

    test('should handle missing categorization data', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks([], bookmarks);

      expect(results.success).toBe(0);
      expect(chrome.bookmarks.move.called).toBe(false);
    });

    test('should handle special characters in category names', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'C++ & Python', confidence: 0.9 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(1);
      expect(chrome.bookmarks.create.called).toBe(true);
    });

    test('should handle very long category paths', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      const mockCategorizations = [
        { 
          bookmarkId: 'b1', 
          category: 'Work > Projects > Client A > Development > Frontend > React > Components', 
          confidence: 0.9 
        }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(1);
      // Should create all levels in the hierarchy
      expect(chrome.bookmarks.create.callCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple bookmarks to same category', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example1.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b2', title: 'Bookmark 2', url: 'https://example2.com', parentId: '1', dateAdded: Date.now() },
              { id: 'b3', title: 'Bookmark 3', url: 'https://example3.com', parentId: '1', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      chrome.bookmarks.getChildren.yields([]);

      const mockCategorizations = [
        { bookmarkId: 'b1', category: 'Work', confidence: 0.9 },
        { bookmarkId: 'b2', category: 'Work', confidence: 0.85 },
        { bookmarkId: 'b3', category: 'Work', confidence: 0.8 }
      ];

      const bookmarks = await categorizer.bookmarkService.getAllBookmarks();
      const results = await categorizer._organizeBookmarks(mockCategorizations, bookmarks);

      expect(results.success).toBe(3);
      // Should only create 'Work' folder once
      expect(chrome.bookmarks.create.callCount).toBeLessThanOrEqual(1);
    });
  });
});
