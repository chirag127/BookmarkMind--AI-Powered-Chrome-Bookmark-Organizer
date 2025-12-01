import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Integration Tests - Folder Manager
 * Tests for folder operations and management
 */

import fs from 'fs';
import path from 'path';

// Load the actual source file
const folderManagerSource = fs.readFileSync(
  path.join(__dirname, '../../../extension/features/bookmarks/folderManager.js'),
  'utf-8'
);

// Execute in global context to define the class
eval(folderManagerSource);

describe('FolderManager', () => {
  let folderManager;

  beforeEach(() => {
    folderManager = new FolderManager();
  });

  describe('Initialization', () => {
    test('should initialize with empty cache', () => {
      expect(folderManager.folderCache).toBeDefined();
      expect(folderManager.folderCache.size).toBe(0);
    });
  });

  describe('createCategoryFolders', () => {
    test('should create folders for all categories', async () => {
      const categories = ['Work', 'Personal', 'Shopping'];

      const folderMap = await folderManager.createCategoryFolders(categories);

      expect(Object.keys(folderMap)).toHaveLength(3);
      expect(folderMap['Work']).toBeTruthy();
      expect(folderMap['Personal']).toBeTruthy();
      expect(folderMap['Shopping']).toBeTruthy();
    });

    test('should handle nested category paths', async () => {
      const categories = ['Work > Projects', 'Personal > Finance'];

      chrome.bookmarks.getChildren
        .onFirstCall().yields([])
        .onSecondCall().yields([])
        .onThirdCall().yields([])
        .onCall(3).yields([]);

      const folderMap = await folderManager.createCategoryFolders(categories);

      expect(Object.keys(folderMap)).toHaveLength(2);
      expect(folderMap['Work > Projects']).toBeTruthy();
    });

    test('should continue on error for individual category', async () => {
      const categories = ['Valid', 'Invalid', 'Another'];

      chrome.bookmarks.create
        .onFirstCall().callsFake((details, cb) => cb({ id: 'f1', title: 'Valid', parentId: '1' }))
        .onSecondCall().throws(new Error('Creation failed'))
        .onThirdCall().callsFake((details, cb) => cb({ id: 'f3', title: 'Another', parentId: '1' }));

      const folderMap = await folderManager.createCategoryFolders(categories);

      expect(folderMap['Valid']).toBeTruthy();
      expect(folderMap['Another']).toBeTruthy();
      expect(folderMap['Invalid']).toBeUndefined();
    });
  });

  describe('_createCategoryFolder', () => {
    test('should create single-level folder', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await folderManager._createCategoryFolder('Work');

      expect(folderId).toBeTruthy();
      expect(chrome.bookmarks.create.calledOnce).toBe(true);
    });

    test('should create multi-level folder hierarchy', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await folderManager._createCategoryFolder('Work/Projects/Active');

      expect(folderId).toBeTruthy();
      expect(chrome.bookmarks.create.callCount).toBe(3);
    });

    test('should reuse existing folders', async () => {
      chrome.bookmarks.getChildren
        .onFirstCall().yields([{ id: 'f1', title: 'Work' }])
        .onSecondCall().yields([]);

      const folderId = await folderManager._createCategoryFolder('Work/Projects');

      expect(chrome.bookmarks.create.callCount).toBe(1); // Only 'Projects'
    });

    test('should use cache for repeated calls', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId1 = await folderManager._createCategoryFolder('Work');
      const folderId2 = await folderManager._createCategoryFolder('Work');

      expect(folderId1).toBe(folderId2);
      expect(chrome.bookmarks.create.callCount).toBe(1);
    });

    test('should respect parent ID parameter', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await folderManager._createCategoryFolder('Projects', '2');

      const createCall = chrome.bookmarks.create.getCall(0);
      expect(createCall.args[0].parentId).toBe('2');
    });
  });

  describe('moveBookmarksToFolders', () => {
    test('should move all bookmarks successfully', async () => {
      const moves = [
        { bookmarkId: 'b1', folderId: 'f1' },
        { bookmarkId: 'b2', folderId: 'f2' },
        { bookmarkId: 'b3', folderId: 'f3' }
      ];

      const results = await folderManager.moveBookmarksToFolders(moves);

      expect(results.success).toBe(3);
      expect(results.errors).toBe(0);
      expect(chrome.bookmarks.move.callCount).toBe(3);
    });

    test('should handle move errors gracefully', async () => {
      const moves = [
        { bookmarkId: 'b1', folderId: 'f1' },
        { bookmarkId: 'b2', folderId: 'f2' }
      ];

      chrome.bookmarks.move
        .onFirstCall().callsFake((id, dest, cb) => cb({ id, ...dest }))
        .onSecondCall().throws(new Error('Move failed'));

      const results = await folderManager.moveBookmarksToFolders(moves);

      expect(results.success).toBe(1);
      expect(results.errors).toBe(1);
      expect(results.errorDetails).toHaveLength(1);
      expect(results.errorDetails[0].bookmarkId).toBe('b2');
    });

    test('should handle empty moves array', async () => {
      const results = await folderManager.moveBookmarksToFolders([]);

      expect(results.success).toBe(0);
      expect(results.errors).toBe(0);
    });
  });

  describe('getFolderStructure', () => {
    test('should return folder tree structure', async () => {
      chrome.bookmarks.getSubTree.yields([{
        id: '1',
        title: 'Bookmarks Bar',
        children: [
          {
            id: 'f1',
            title: 'Work',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com' }
            ]
          },
          { id: 'b2', title: 'Bookmark 2', url: 'https://test.com' }
        ]
      }]);

      const structure = await folderManager.getFolderStructure('1');

      expect(structure).toBeTruthy();
      expect(structure.id).toBe('1');
      expect(structure.children).toHaveLength(1);
      expect(structure.bookmarkCount).toBe(2);
    });

    test('should count bookmarks correctly', async () => {
      chrome.bookmarks.getSubTree.yields([{
        id: '1',
        title: 'Root',
        children: [
          {
            id: 'f1',
            title: 'Folder 1',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example1.com' },
              { id: 'b2', title: 'Bookmark 2', url: 'https://example2.com' }
            ]
          },
          {
            id: 'f2',
            title: 'Folder 2',
            children: [
              { id: 'b3', title: 'Bookmark 3', url: 'https://example3.com' }
            ]
          }
        ]
      }]);

      const structure = await folderManager.getFolderStructure('1');

      expect(structure.bookmarkCount).toBe(3);
      expect(structure.children[0].bookmarkCount).toBe(2);
      expect(structure.children[1].bookmarkCount).toBe(1);
    });

    test('should handle API errors', async () => {
      chrome.bookmarks.getSubTree.throws(new Error('API Error'));

      const structure = await folderManager.getFolderStructure('1');

      expect(structure).toBeNull();
    });
  });

  describe('_buildFolderTree', () => {
    test('should build tree with folders and bookmarks', () => {
      const node = {
        id: '1',
        title: 'Root',
        children: [
          {
            id: 'f1',
            title: 'Folder 1',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com' }
            ]
          },
          { id: 'b2', title: 'Bookmark 2', url: 'https://test.com' }
        ]
      };

      const tree = folderManager._buildFolderTree(node);

      expect(tree.id).toBe('1');
      expect(tree.children).toHaveLength(1);
      expect(tree.bookmarkCount).toBe(2);
    });

    test('should handle empty folders', () => {
      const node = {
        id: 'f1',
        title: 'Empty Folder',
        children: []
      };

      const tree = folderManager._buildFolderTree(node);

      expect(tree.children).toHaveLength(0);
      expect(tree.bookmarkCount).toBe(0);
    });
  });

  describe('cleanupEmptyFolders', () => {
    test('should remove empty folders', async () => {
      chrome.bookmarks.getSubTree.yields([{
        id: '1',
        title: 'Root',
        children: [
          {
            id: 'f1',
            title: 'Empty Folder',
            children: []
          },
          {
            id: 'f2',
            title: 'Folder with Bookmarks',
            children: [
              { id: 'b1', title: 'Bookmark', url: 'https://example.com' }
            ]
          }
        ]
      }]);

      chrome.bookmarks.remove.callsFake((id, cb) => {
        if (cb) cb();
        return Promise.resolve();
      });

      const removedCount = await folderManager.cleanupEmptyFolders('1');

      expect(removedCount).toBe(1);
      expect(chrome.bookmarks.remove.calledOnce).toBe(true);
    });

    test('should not remove Bookmarks Bar', async () => {
      chrome.bookmarks.getSubTree.yields([{
        id: '1',
        title: 'Bookmarks Bar',
        children: []
      }]);

      const removedCount = await folderManager.cleanupEmptyFolders('1');

      expect(removedCount).toBe(0);
      expect(chrome.bookmarks.remove.called).toBe(false);
    });

    test('should handle nested empty folders', async () => {
      chrome.bookmarks.getSubTree.yields([{
        id: '1',
        title: 'Root',
        children: [
          {
            id: 'f1',
            title: 'Parent Folder',
            children: [
              {
                id: 'f2',
                title: 'Empty Child',
                children: []
              }
            ]
          }
        ]
      }]);

      chrome.bookmarks.remove.callsFake((id, cb) => {
        if (cb) cb();
        return Promise.resolve();
      });

      const removedCount = await folderManager.cleanupEmptyFolders('1');

      expect(removedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('exportOrganization', () => {
    test('should export bookmark organization', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Bookmark 1', url: 'https://example.com', dateAdded: Date.now() }
            ]
          }
        ]
      }]);

      const exportData = await folderManager.exportOrganization();

      expect(exportData).toHaveProperty('exportDate');
      expect(exportData).toHaveProperty('version');
      expect(exportData).toHaveProperty('bookmarks');
      expect(Array.isArray(exportData.bookmarks)).toBe(true);
    });

    test('should include bookmark metadata in export', async () => {
      const testDate = Date.now();
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              { id: 'b1', title: 'Test', url: 'https://example.com', dateAdded: testDate }
            ]
          }
        ]
      }]);

      const exportData = await folderManager.exportOrganization();

      expect(exportData.bookmarks.length).toBeGreaterThan(0);
      const bookmark = exportData.bookmarks.find(b => b.title === 'Test');
      expect(bookmark).toBeTruthy();
      expect(bookmark.url).toBe('https://example.com');
      expect(bookmark.dateAdded).toBe(testDate);
    });
  });

  describe('_findFolderByName', () => {
    test('should find folder by name', async () => {
      chrome.bookmarks.getChildren.yields([
        { id: 'f1', title: 'Work' },
        { id: 'f2', title: 'Personal' }
      ]);

      const folder = await folderManager._findFolderByName('Work', '1');

      expect(folder).toBeTruthy();
      expect(folder.id).toBe('f1');
    });

    test('should return null if not found', async () => {
      chrome.bookmarks.getChildren.yields([
        { id: 'f1', title: 'Work' }
      ]);

      const folder = await folderManager._findFolderByName('Personal', '1');

      expect(folder).toBeNull();
    });

    test('should ignore bookmarks', async () => {
      chrome.bookmarks.getChildren.yields([
        { id: 'b1', title: 'Work', url: 'https://example.com' },
        { id: 'f1', title: 'Work' }
      ]);

      const folder = await folderManager._findFolderByName('Work', '1');

      expect(folder.id).toBe('f1');
      expect(folder).not.toHaveProperty('url');
    });
  });

  describe('Cache Management', () => {
    test('should cache folder IDs', async () => {
      chrome.bookmarks.getChildren.yields([]);

      await folderManager._createCategoryFolder('Work');
      expect(folderManager.folderCache.size).toBe(1);
    });

    test('should clear cache', () => {
      folderManager.folderCache.set('test', 'value');
      expect(folderManager.folderCache.size).toBe(1);

      folderManager.clearCache();
      expect(folderManager.folderCache.size).toBe(0);
    });

    test('should use separate cache entries for different parents', async () => {
      chrome.bookmarks.getChildren.yields([]);

      await folderManager._createCategoryFolder('Work', '1');
      await folderManager._createCategoryFolder('Work', '2');

      expect(folderManager.folderCache.size).toBe(2);
    });
  });
});
