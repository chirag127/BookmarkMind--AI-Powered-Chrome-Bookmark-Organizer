/**
 * BookmarkMind - Bookmark Service
 * Handles all Chrome Bookmarks API interactions
 */

class BookmarkService {
  constructor() {
    this.bookmarkTree = null;
  }

  /**
   * Get all bookmarks from Chrome
   * @returns {Promise<Array>} Array of bookmark objects
   */
  async getAllBookmarks() {
    try {
      // Check if Chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.bookmarks) {
        throw new Error('Chrome bookmarks API not available. Make sure this runs in extension context.');
      }

      console.log('Accessing Chrome bookmarks API...');
      const tree = await chrome.bookmarks.getTree();

      if (!tree || !tree[0]) {
        throw new Error('Invalid bookmark tree structure received');
      }

      this.bookmarkTree = tree;

      const bookmarks = [];
      this._extractBookmarks(tree[0], bookmarks, '');

      console.log(`Found ${bookmarks.length} bookmarks`);
      console.log('Bookmark distribution by folder:', {
        bookmarksBar: bookmarks.filter(b => b.parentId === '1').length,
        otherBookmarks: bookmarks.filter(b => b.parentId === '2').length,
        mobileBookmarks: bookmarks.filter(b => b.parentId === '3').length,
        other: bookmarks.filter(b => !['1', '2', '3'].includes(b.parentId)).length
      });

      return bookmarks;
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      console.error('Chrome API availability:', {
        chrome: typeof chrome !== 'undefined',
        bookmarks: typeof chrome?.bookmarks !== 'undefined',
        getTree: typeof chrome?.bookmarks?.getTree !== 'undefined'
      });
      throw new Error(`Failed to retrieve bookmarks: ${error.message}`);
    }
  }

  /**
   * Recursively extract bookmarks from tree structure
   * @param {Object} node - Bookmark tree node
   * @param {Array} bookmarks - Array to collect bookmarks
   * @param {string} currentPath - Current folder path
   */
  _extractBookmarks(node, bookmarks, currentPath = '') {
    if (node.url) {
      // This is a bookmark (has URL)
      bookmarks.push({
        id: node.id,
        title: node.title || 'Untitled',
        url: node.url,
        parentId: node.parentId,
        index: node.index,
        dateAdded: node.dateAdded,
        currentFolder: currentPath || 'Root',
        currentFolderName: this._getFolderName(node.parentId)
      });
    }

    // Recursively process children
    if (node.children) {
      const nodePath = currentPath ? `${currentPath}/${node.title}` : node.title;
      node.children.forEach(child => {
        this._extractBookmarks(child, bookmarks, nodePath);
      });
    }
  }

  /**
   * Get folder name by ID
   * @param {string} folderId - Folder ID
   * @returns {string} Folder name
   */
  _getFolderName(folderId) {
    const folderNames = {
      '0': 'Root',
      '1': 'Bookmarks Bar',
      '2': 'Other Bookmarks',
      '3': 'Mobile Bookmarks'
    };
    return folderNames[folderId] || 'Custom Folder';
  }

  /**
   * Create a new folder
   * @param {string} title - Folder name
   * @param {string} parentId - Parent folder ID (optional)
   * @returns {Promise<Object>} Created folder object
   */
  async createFolder(title, parentId = '1') {
    try {
      const folder = await chrome.bookmarks.create({
        parentId: parentId,
        title: title
      });
      console.log(`Created folder: ${title}`);
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${title}`);
    }
  }

  /**
   * Move bookmark to a folder
   * @param {string} bookmarkId - Bookmark ID
   * @param {string} parentId - Target folder ID
   * @param {number} index - Position in folder (optional)
   * @returns {Promise<Object>} Moved bookmark object
   */
  async moveBookmark(bookmarkId, parentId, index) {
    try {
      const moveDetails = { parentId };
      if (index !== undefined) {
        moveDetails.index = index;
      }

      const bookmark = await chrome.bookmarks.move(bookmarkId, moveDetails);
      console.log(`Moved bookmark ${bookmarkId} to folder ${parentId}`);
      return bookmark;
    } catch (error) {
      console.error('Error moving bookmark:', error);
      throw new Error(`Failed to move bookmark ${bookmarkId}`);
    }
  }

  /**
   * Find or create a folder by path (e.g., "Work/Projects/Current")
   * @param {string} path - Folder path separated by '/'
   * @param {string} rootParentId - Root parent ID (default: bookmarks bar)
   * @returns {Promise<string>} Folder ID
   */
  async findOrCreateFolderByPath(path, rootParentId = '1') {
    const parts = path.split('/').filter(part => part.trim());
    let currentParentId = rootParentId;

    for (const part of parts) {
      const existingFolder = await this._findFolderByName(part, currentParentId);

      if (existingFolder) {
        currentParentId = existingFolder.id;
      } else {
        const newFolder = await this.createFolder(part, currentParentId);
        currentParentId = newFolder.id;
      }
    }

    return currentParentId;
  }

  /**
   * Find folder by name within a parent
   * @param {string} name - Folder name
   * @param {string} parentId - Parent folder ID
   * @returns {Promise<Object|null>} Folder object or null
   */
  async _findFolderByName(name, parentId) {
    try {
      const children = await chrome.bookmarks.getChildren(parentId);
      return children.find(child => !child.url && child.title === name) || null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  }

  /**
   * Get bookmark statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getBookmarkStats() {
    try {
      const bookmarks = await this.getAllBookmarks();
      const folders = await this._getAllFolders();

      // Count uncategorized bookmarks (those in main folders, not subfolders)
      const uncategorized = bookmarks.filter(b => {
        // Include bookmarks directly in main folders (Bookmarks Bar, Other Bookmarks, Mobile Bookmarks)
        return ['1', '2', '3'].includes(b.parentId);
      }).length;

      console.log('Stats calculation:', {
        totalBookmarks: bookmarks.length,
        totalFolders: folders.length,
        uncategorized: uncategorized,
        bookmarksByParent: {
          '1': bookmarks.filter(b => b.parentId === '1').length,
          '2': bookmarks.filter(b => b.parentId === '2').length,
          '3': bookmarks.filter(b => b.parentId === '3').length,
          'other': bookmarks.filter(b => !['1', '2', '3'].includes(b.parentId)).length
        }
      });

      return {
        totalBookmarks: bookmarks.length,
        totalFolders: folders.length,
        uncategorized: uncategorized
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalBookmarks: 0, totalFolders: 0, uncategorized: 0 };
    }
  }

  /**
   * Get all folders
   * @returns {Promise<Array>} Array of folder objects
   */
  async _getAllFolders() {
    try {
      const tree = await chrome.bookmarks.getTree();
      const folders = [];
      this._extractFolders(tree[0], folders);
      return folders;
    } catch (error) {
      console.error('Error getting folders:', error);
      return [];
    }
  }

  /**
   * Recursively extract folders from tree
   * @param {Object} node - Tree node
   * @param {Array} folders - Array to collect folders
   */
  _extractFolders(node, folders) {
    if (!node.url && node.id !== '0') {
      // This is a folder (no URL and not root)
      folders.push({
        id: node.id,
        title: node.title,
        parentId: node.parentId
      });
    }

    if (node.children) {
      node.children.forEach(child => {
        this._extractFolders(child, folders);
      });
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BookmarkService = BookmarkService;
}
// ES6 export for modules
export { BookmarkService };