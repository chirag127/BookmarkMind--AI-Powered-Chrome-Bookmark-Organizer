/**
 * Integration Tests - Bookmark Service
 * Tests for Chrome Bookmarks API operations
 */

const fs = require('fs');
const path = require('path');

// Load the actual source file
const bookmarkServiceSource = fs.readFileSync(
  path.join(__dirname, '../scripts/bookmarkService.js'),
  'utf-8'
);

// Execute in global context to define the class
eval(bookmarkServiceSource);

describe('BookmarkService', () => {
  let bookmarkService;

  beforeEach(() => {
    bookmarkService = new BookmarkService();
  });

  describe('Initialization', () => {
    test('should initialize with null bookmark tree', () => {
      expect(bookmarkService.bookmarkTree).toBeNull();
    });
  });

  describe('getAllBookmarks', () => {
    test('should retrieve all bookmarks from Chrome API', async () => {
      // Mock Chrome bookmarks API with test data
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              {
                id: 'b1',
                title: 'Test Bookmark 1',
                url: 'https://example.com',
                parentId: '1',
                dateAdded: Date.now()
              }
            ]
          },
          {
            id: '2',
            title: 'Other Bookmarks',
            children: [
              {
                id: 'b2',
                title: 'Test Bookmark 2',
                url: 'https://test.com',
                parentId: '2',
                dateAdded: Date.now()
              }
            ]
          }
        ]
      }]);

      const bookmarks = await bookmarkService.getAllBookmarks();

      expect(bookmarks).toHaveLength(2);
      expect(bookmarks[0]).toHaveProperty('id');
      expect(bookmarks[0]).toHaveProperty('title');
      expect(bookmarks[0]).toHaveProperty('url');
      expect(bookmarks[0]).toHaveProperty('parentId');
    });

    test('should handle empty bookmark tree', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          { id: '1', title: 'Bookmarks Bar', children: [] },
          { id: '2', title: 'Other Bookmarks', children: [] },
          { id: '3', title: 'Mobile Bookmarks', children: [] }
        ]
      }]);

      const bookmarks = await bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(0);
    });

    test('should handle nested folder structure', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              {
                id: 'f1',
                title: 'Work',
                children: [
                  {
                    id: 'b1',
                    title: 'Work Bookmark',
                    url: 'https://work.com',
                    parentId: 'f1',
                    dateAdded: Date.now()
                  }
                ]
              }
            ]
          }
        ]
      }]);

      const bookmarks = await bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].currentFolder).toContain('Work');
    });

    test('should throw error if Chrome API unavailable', async () => {
      const originalChrome = global.chrome;
      global.chrome = undefined;

      await expect(bookmarkService.getAllBookmarks())
        .rejects.toThrow('Chrome bookmarks API not available');

      global.chrome = originalChrome;
    });
  });

  describe('createFolder', () => {
    test('should create folder in Bookmarks Bar by default', async () => {
      const folder = await bookmarkService.createFolder('Test Folder');

      expect(chrome.bookmarks.create.calledOnce).toBe(true);
      expect(folder).toHaveProperty('id');
      expect(folder).toHaveProperty('title', 'Test Folder');
      expect(folder).toHaveProperty('parentId', '1');
    });

    test('should create folder in specified parent', async () => {
      const folder = await bookmarkService.createFolder('Sub Folder', '2');

      expect(folder.parentId).toBe('2');
      expect(folder.title).toBe('Sub Folder');
    });

    test('should handle folder creation errors', async () => {
      chrome.bookmarks.create.callsFake(() => {
        throw new Error('Creation failed');
      });

      await expect(bookmarkService.createFolder('Test'))
        .rejects.toThrow('Failed to create folder');
    });
  });

  describe('moveBookmark', () => {
    test('should move bookmark to target folder', async () => {
      chrome.bookmarks.get.withArgs('b1').yields([{
        id: 'b1',
        title: 'Test Bookmark',
        url: 'https://example.com',
        parentId: '1'
      }]);

      chrome.bookmarks.get.withArgs('1').yields([{
        id: '1',
        title: 'Bookmarks Bar'
      }]);

      chrome.bookmarks.get.withArgs('f1').yields([{
        id: 'f1',
        title: 'Target Folder'
      }]);

      const result = await bookmarkService.moveBookmark('b1', 'f1');

      expect(chrome.bookmarks.move.calledOnce).toBe(true);
      expect(result).toHaveProperty('parentId', 'f1');
    });

    test('should move bookmark with specified index', async () => {
      chrome.bookmarks.get.withArgs('b1').yields([{
        id: 'b1',
        title: 'Test Bookmark',
        url: 'https://example.com',
        parentId: '1'
      }]);

      chrome.bookmarks.get.withArgs('1').yields([{
        id: '1',
        title: 'Bookmarks Bar'
      }]);

      chrome.bookmarks.get.withArgs('f1').yields([{
        id: 'f1',
        title: 'Target Folder'
      }]);

      await bookmarkService.moveBookmark('b1', 'f1', 2);

      const moveCall = chrome.bookmarks.move.getCall(0);
      expect(moveCall.args[1]).toHaveProperty('index', 2);
    });

    test('should handle move errors', async () => {
      chrome.bookmarks.move.callsFake(() => {
        throw new Error('Move failed');
      });

      await expect(bookmarkService.moveBookmark('b1', 'f1'))
        .rejects.toThrow('Failed to move bookmark');
    });
  });

  describe('findOrCreateFolderByPath', () => {
    test('should create hierarchical folder structure', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await bookmarkService.findOrCreateFolderByPath('Work > Projects > Active');

      expect(chrome.bookmarks.create.callCount).toBeGreaterThan(0);
      expect(folderId).toBeTruthy();
    });

    test('should reuse existing folders', async () => {
      chrome.bookmarks.getChildren
        .onFirstCall().yields([{ id: 'f1', title: 'Work' }])
        .onSecondCall().yields([{ id: 'f2', title: 'Projects' }])
        .onThirdCall().yields([]);

      const folderId = await bookmarkService.findOrCreateFolderByPath('Work > Projects > Active');

      // Should only create the 'Active' folder since Work and Projects exist
      expect(chrome.bookmarks.create.callCount).toBeLessThanOrEqual(1);
      expect(folderId).toBeTruthy();
    });

    test('should handle legacy slash separator', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await bookmarkService.findOrCreateFolderByPath('Work/Projects/Active');

      expect(folderId).toBeTruthy();
      expect(chrome.bookmarks.create.called).toBe(true);
    });

    test('should handle single-level path', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await bookmarkService.findOrCreateFolderByPath('Work');

      expect(folderId).toBeTruthy();
    });

    test('should trim whitespace from path parts', async () => {
      chrome.bookmarks.getChildren.yields([]);

      const folderId = await bookmarkService.findOrCreateFolderByPath('  Work  >  Projects  ');

      expect(folderId).toBeTruthy();
    });
  });

  describe('getBookmarkStats', () => {
    test('should return correct statistics', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              createMockBookmark('b1', 'Bookmark 1', 'https://example1.com'),
              createMockBookmark('b2', 'Bookmark 2', 'https://example2.com')
            ]
          },
          {
            id: '2',
            title: 'Other Bookmarks',
            children: [
              {
                id: 'f1',
                title: 'Folder 1',
                children: [
                  createMockBookmark('b3', 'Bookmark 3', 'https://example3.com', 'f1')
                ]
              }
            ]
          }
        ]
      }]);

      const stats = await bookmarkService.getBookmarkStats();

      expect(stats.totalBookmarks).toBe(3);
      expect(stats.uncategorized).toBe(2); // b1 and b2 in main folders
      expect(stats.totalFolders).toBeGreaterThanOrEqual(1);
    });

    test('should handle empty bookmarks', async () => {
      chrome.bookmarks.getTree.yields([{
        id: '0',
        title: '',
        children: [
          { id: '1', title: 'Bookmarks Bar', children: [] },
          { id: '2', title: 'Other Bookmarks', children: [] }
        ]
      }]);

      const stats = await bookmarkService.getBookmarkStats();

      expect(stats.totalBookmarks).toBe(0);
      expect(stats.uncategorized).toBe(0);
    });
  });

  describe('_extractBookmarks', () => {
    test('should extract bookmarks recursively', () => {
      const node = {
        id: '1',
        title: 'Root',
        children: [
          {
            id: 'b1',
            title: 'Bookmark 1',
            url: 'https://example.com',
            parentId: '1'
          },
          {
            id: 'f1',
            title: 'Folder',
            children: [
              {
                id: 'b2',
                title: 'Bookmark 2',
                url: 'https://test.com',
                parentId: 'f1'
              }
            ]
          }
        ]
      };

      const bookmarks = [];
      bookmarkService._extractBookmarks(node, bookmarks, '');

      expect(bookmarks).toHaveLength(2);
      expect(bookmarks[0].id).toBe('b1');
      expect(bookmarks[1].id).toBe('b2');
    });

    test('should set correct folder paths', () => {
      const node = {
        id: '1',
        title: 'Root',
        children: [
          {
            id: 'f1',
            title: 'Work',
            children: [
              {
                id: 'b1',
                title: 'Bookmark',
                url: 'https://example.com',
                parentId: 'f1'
              }
            ]
          }
        ]
      };

      const bookmarks = [];
      bookmarkService._extractBookmarks(node, bookmarks, '');

      expect(bookmarks[0].currentFolder).toContain('Work');
    });
  });

  describe('_getFolderName', () => {
    test('should return correct folder names for default folders', () => {
      expect(bookmarkService._getFolderName('0')).toBe('Root');
      expect(bookmarkService._getFolderName('1')).toBe('Bookmarks Bar');
      expect(bookmarkService._getFolderName('2')).toBe('Other Bookmarks');
      expect(bookmarkService._getFolderName('3')).toBe('Mobile Bookmarks');
    });

    test('should return default name for custom folders', () => {
      expect(bookmarkService._getFolderName('custom123')).toBe('Custom Folder');
    });
  });

  describe('_findFolderByName', () => {
    test('should find folder by exact name match', async () => {
      chrome.bookmarks.getChildren.yields([
        { id: 'f1', title: 'Work' },
        { id: 'f2', title: 'Personal' },
        { id: 'b1', title: 'Bookmark', url: 'https://example.com' }
      ]);

      const folder = await bookmarkService._findFolderByName('Work', '1');

      expect(folder).toBeTruthy();
      expect(folder.id).toBe('f1');
      expect(folder.title).toBe('Work');
    });

    test('should return null if folder not found', async () => {
      chrome.bookmarks.getChildren.yields([
        { id: 'f1', title: 'Work' }
      ]);

      const folder = await bookmarkService._findFolderByName('NonExistent', '1');

      expect(folder).toBeNull();
    });

    test('should ignore bookmarks and only return folders', async () => {
      chrome.bookmarks.getChildren.yields([
        { id: 'b1', title: 'Work', url: 'https://example.com' },
        { id: 'f1', title: 'Work' }
      ]);

      const folder = await bookmarkService._findFolderByName('Work', '1');

      expect(folder.id).toBe('f1');
      expect(folder).not.toHaveProperty('url');
    });
  });
});
