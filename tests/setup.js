/**
 * Jest Test Setup
 * Configures Chrome API mocks and test environment
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const chrome = require('sinon-chrome');

// Setup Chrome API mock globally with proper Promise support
global.chrome = chrome;

// Mock Chrome Storage API
chrome.storage.sync.get.resolves({});
chrome.storage.sync.set.resolves();
chrome.storage.local.get.resolves({});
chrome.storage.local.set.resolves();

// Mock Chrome Bookmarks API with Promise-based returns
chrome.bookmarks.getTree.resolves([{
  id: '0',
  title: '',
  children: [
    {
      id: '1',
      title: 'Bookmarks Bar',
      children: []
    },
    {
      id: '2',
      title: 'Other Bookmarks',
      children: []
    },
    {
      id: '3',
      title: 'Mobile Bookmarks',
      children: []
    }
  ]
}]);

chrome.bookmarks.create.callsFake((details) => {
  const folder = {
    id: `folder_${Date.now()}_${Math.random()}`,
    title: details.title,
    parentId: details.parentId || '1',
    dateAdded: Date.now(),
    index: 0
  };
  return Promise.resolve(folder);
});

chrome.bookmarks.move.callsFake((bookmarkId, destination) => {
  const bookmark = {
    id: bookmarkId,
    title: 'Moved Bookmark',
    parentId: destination.parentId,
    index: destination.index || 0
  };
  return Promise.resolve(bookmark);
});

chrome.bookmarks.get.callsFake((id) => {
  const bookmark = [{
    id: id,
    title: 'Test Bookmark',
    url: 'https://example.com',
    parentId: '1'
  }];
  return Promise.resolve(bookmark);
});

chrome.bookmarks.getChildren.callsFake(() => {
  return Promise.resolve([]);
});

chrome.bookmarks.getSubTree.callsFake((id) => {
  return Promise.resolve([{
    id: id,
    title: 'Test Folder',
    children: []
  }]);
});

chrome.bookmarks.remove.callsFake(() => {
  return Promise.resolve();
});

// Mock Chrome Runtime API
chrome.runtime.sendMessage.callsFake(() => {
  return Promise.resolve({ success: true });
});

// Export for tests
module.exports = { chrome };

// Reset mocks before each test
if (typeof beforeEach !== 'undefined') {
  beforeEach(() => {
    chrome.flush();
    
    // Restore default mock behaviors
    chrome.bookmarks.getTree.resolves([{
      id: '0',
      title: '',
      children: [
        { id: '1', title: 'Bookmarks Bar', children: [] },
        { id: '2', title: 'Other Bookmarks', children: [] },
        { id: '3', title: 'Mobile Bookmarks', children: [] }
      ]
    }]);
    
    chrome.bookmarks.getChildren.resolves([]);
    chrome.bookmarks.get.callsFake((id) => {
      return Promise.resolve([{
        id: id,
        title: 'Test Bookmark',
        url: 'https://example.com',
        parentId: '1'
      }]);
    });
  });
}

// Cleanup after each test
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    chrome.reset();
  });
}

// Global test utilities
global.createMockBookmark = (id, title, url, parentId = '1') => ({
  id: id || `bookmark_${Date.now()}`,
  title: title || 'Test Bookmark',
  url: url || 'https://example.com',
  parentId: parentId,
  dateAdded: Date.now(),
  currentFolder: 'Bookmarks Bar',
  currentFolderName: 'Bookmarks Bar'
});

global.createMockFolder = (id, title, parentId = '1') => ({
  id: id || `folder_${Date.now()}`,
  title: title || 'Test Folder',
  parentId: parentId,
  dateAdded: Date.now(),
  index: 0
});

global.mockFetch = (responseData, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status: status,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData))
    })
  );
};

// Suppress console logs in tests unless explicitly needed
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
