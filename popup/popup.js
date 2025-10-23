/**
 * BookmarkMind - Popup Script
 * Handles popup UI interactions and communication with background script
 */

class PopupController {
  constructor() {
    this.isProcessing = false;
    this.settings = null;
    this.stats = null;

    // Check extension context
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.error('Chrome extension APIs not available!');
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h3>⚠️ Extension Context Error</h3>
          <p>Chrome extension APIs are not available.</p>
          <p>Please make sure you're running this as a Chrome extension.</p>
          <p>Go to chrome://extensions/ and reload the extension.</p>
        </div>
      `;
      return;
    }

    this.initializeElements();
    this.attachEventListeners();
    this.loadInitialData();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // Buttons
    this.sortBtn = document.getElementById('sortBtn');
    this.deleteEmptyFoldersBtn = document.getElementById('deleteEmptyFoldersBtn');
    this.removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn');
    this.moveToBookmarkBarBtn = document.getElementById('moveToBookmarkBarBtn');
    this.forceReorganizeBtn = document.getElementById('forceReorganizeBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.helpLink = document.getElementById('helpLink');
    this.debugBtn = document.getElementById('debugBtn');
    this.debugResults = document.getElementById('debugResults');

    // Status elements
    this.extensionStatus = document.getElementById('extensionStatus');
    this.statusDot = this.extensionStatus?.querySelector('.status-dot');
    this.statusText = this.extensionStatus?.querySelector('.status-text');

    // Stats
    this.totalBookmarks = document.getElementById('totalBookmarks');
    this.uncategorized = document.getElementById('uncategorized');
    this.lastSortTime = document.getElementById('lastSortTime');

    // Sections
    this.apiKeyWarning = document.getElementById('apiKeyWarning');
    this.actionSection = document.getElementById('actionSection');
    this.progressSection = document.getElementById('progressSection');
    this.resultsSection = document.getElementById('resultsSection');

    // Progress elements
    this.progressText = document.getElementById('progressText');
    this.progressPercent = document.getElementById('progressPercent');
    this.progressFill = document.getElementById('progressFill');

    // Results elements
    this.resultsTitle = document.getElementById('resultsTitle');
    this.resultsMessage = document.getElementById('resultsMessage');
    this.processedCount = document.getElementById('processedCount');
    this.categorizedCount = document.getElementById('categorizedCount');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.sortBtn.addEventListener('click', () => this.startCategorization());
    this.deleteEmptyFoldersBtn.addEventListener('click', () => this.deleteEmptyFolders());
    this.removeDuplicatesBtn.addEventListener('click', () => this.removeDuplicateUrls());
    this.moveToBookmarkBarBtn.addEventListener('click', () => this.moveAllToBookmarkBar());
    this.forceReorganizeBtn.addEventListener('click', () => this.startCategorization(true));
    this.exportBtn.addEventListener('click', () => this.exportBookmarks());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
    this.debugBtn.addEventListener('click', () => this.runDebugTest());

    // Test categorization button
    this.testCategorizationBtn = document.getElementById('testCategorizationBtn');
    if (this.testCategorizationBtn) {
      this.testCategorizationBtn.addEventListener('click', () => this.testCategorization());
    }

    // Test communication button
    this.testCommBtn = document.getElementById('testCommBtn');
    if (this.testCommBtn) {
      this.testCommBtn.addEventListener('click', () => this.testCommunication());
    }

    // Listen for progress updates from background script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'categorizationProgress') {
        this.updateProgress(message.data);
      }
    });
  }

  /**
   * Load initial data when popup opens
   */
  async loadInitialData() {
    try {
      await this.loadSettings();
      await this.loadStats();

      // Fallback: Test direct bookmark access if stats are empty
      if (!this.stats || this.stats.totalBookmarks === 0) {
        console.log('Stats empty, testing direct bookmark access...');
        await this.testDirectBookmarkAccess();
      }

      this.updateUI();
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load extension data');
    }
  }

  /**
   * Test direct bookmark access as fallback
   */
  async testDirectBookmarkAccess() {
    try {
      console.log('Testing direct bookmark access...');
      const tree = await chrome.bookmarks.getTree();

      const bookmarks = [];
      function extractBookmarks(node) {
        if (node.url) {
          bookmarks.push({
            id: node.id,
            title: node.title,
            url: node.url,
            parentId: node.parentId
          });
        }
        if (node.children) {
          node.children.forEach(extractBookmarks);
        }
      }

      extractBookmarks(tree[0]);

      const uncategorized = bookmarks.filter(b => ['1', '2', '3'].includes(b.parentId)).length;

      console.log('Direct bookmark access results:', {
        total: bookmarks.length,
        uncategorized: uncategorized
      });

      // Update stats with direct results
      this.stats = {
        totalBookmarks: bookmarks.length,
        uncategorized: uncategorized,
        totalFolders: 0
      };

    } catch (error) {
      console.error('Direct bookmark access failed:', error);
    }
  }

  /**
   * Load user settings
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['bookmarkMindSettings']);
      this.settings = result.bookmarkMindSettings || {};
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = {};
    }
  }

  /**
   * Load bookmark statistics
   */
  async loadStats() {
    try {
      console.log('Loading stats...');
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });

      console.log('Stats response:', response);

      if (response && response.success) {
        this.stats = response.data;
        console.log('Stats loaded successfully:', this.stats);
      } else {
        console.error('Failed to get stats:', response?.error || 'No response');
        this.stats = { totalBookmarks: 0, uncategorized: 0, totalFolders: 0 };
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      this.stats = { totalBookmarks: 0, uncategorized: 0, totalFolders: 0 };
    }
  }

  /**
   * Update UI based on current state
   */
  updateUI() {
    // Update stats display
    this.totalBookmarks.textContent = this.stats.totalBookmarks || 0;
    this.uncategorized.textContent = this.stats.uncategorized || 0;

    // Update extension status
    this.updateExtensionStatus();

    // Update last sort time
    if (this.settings.lastSortTime) {
      const date = new Date(this.settings.lastSortTime);
      this.lastSortTime.textContent = this.formatRelativeTime(date);
    } else {
      this.lastSortTime.textContent = 'Never';
    }

    // Show/hide API key warning
    if (!this.settings.apiKey) {
      this.apiKeyWarning.classList.remove('hidden');
      this.sortBtn.disabled = true;
    } else {
      this.apiKeyWarning.classList.add('hidden');
      this.sortBtn.disabled = false;
    }

    // Show debug button if no bookmarks detected
    const debugSection = document.getElementById('debugSection');
    if (uncategorizedCount === 0 && this.stats.totalBookmarks === 0) {
      debugSection.classList.remove('hidden');
    } else {
      debugSection.classList.add('hidden');
    }

    // Update sort button text based on uncategorized count
    const uncategorizedCount = this.stats.uncategorized || 0;
    const totalBookmarks = this.stats.totalBookmarks || 0;
    console.log('Popup stats:', this.stats); // Debug logging

    if (uncategorizedCount === 0 && totalBookmarks > 0) {
      this.sortBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
        </svg>
        All Organized!
      `;
      this.sortBtn.disabled = true;

      // Show the force reorganize button when all bookmarks are organized
      if (this.forceReorganizeBtn) {
        this.forceReorganizeBtn.style.display = 'flex';
      }
    } else if (uncategorizedCount > 0) {
      this.sortBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 18H9V16H3V18ZM3 6V8H21V6H3ZM3 13H15V11H3V13Z" fill="currentColor"/>
        </svg>
        Sort ${uncategorizedCount} Bookmarks
      `;
      this.sortBtn.disabled = false;

      // Hide the force reorganize button when there are uncategorized bookmarks
      if (this.forceReorganizeBtn) {
        this.forceReorganizeBtn.style.display = 'none';
      }
    } else {
      // No bookmarks at all
      this.sortBtn.disabled = true;
      if (this.forceReorganizeBtn) {
        this.forceReorganizeBtn.style.display = 'none';
      }
    }
  }

  /**
   * Delete empty folders that don't contain any bookmarks
   */
  async deleteEmptyFolders() {
    if (this.isProcessing) return;

    // Show confirmation dialog
    const confirmed = confirm(
      'This will scan all bookmark folders and delete empty ones.\n\n' +
      'Empty folders are those that contain no bookmarks or only other empty folders.\n\n' +
      'This action cannot be undone automatically.\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) return;

    this.isProcessing = true;
    this.showProgress();
    this.updateProgress('Scanning for empty folders...', 0);

    try {
      console.log('Popup: Starting empty folder deletion...');

      // Get all bookmark folders
      const bookmarkTree = await chrome.bookmarks.getTree();
      const allFolders = [];

      // Collect all folders from all locations
      const collectFoldersFromTree = (nodes, parentTitle = '') => {
        for (const node of nodes) {
          if (!node.url) { // It's a folder
            // Skip root folders (Bookmarks Bar, Other Bookmarks, Mobile Bookmarks)
            if (!['1', '2', '3'].includes(node.id)) {
              allFolders.push({
                id: node.id,
                title: node.title,
                parentId: node.parentId,
                parentTitle: parentTitle,
                children: node.children || []
              });
            }
          }
          if (node.children) {
            collectFoldersFromTree(node.children, node.title);
          }
        }
      };

      collectFoldersFromTree(bookmarkTree);

      console.log(`Found ${allFolders.length} folders to analyze`);
      this.updateProgress(`Analyzing ${allFolders.length} folders...`, 10);

      if (allFolders.length === 0) {
        this.showResults({
          processed: 0,
          deleted: 0,
          message: 'No folders found to analyze.'
        });
        return;
      }

      // Check which folders are empty (recursively)
      const emptyFolders = [];
      const folderContents = new Map();

      // First pass: get contents of all folders
      for (let i = 0; i < allFolders.length; i++) {
        const folder = allFolders[i];
        const progress = Math.round(10 + (i / allFolders.length) * 40);

        this.updateProgress(`Checking "${folder.title}"... (${i + 1}/${allFolders.length})`, progress);

        try {
          const children = await chrome.bookmarks.getChildren(folder.id);
          folderContents.set(folder.id, children);

          // Count bookmarks (not folders) in this folder
          const bookmarkCount = children.filter(child => child.url).length;
          const subfolderCount = children.filter(child => !child.url).length;

          console.log(`Folder "${folder.title}": ${bookmarkCount} bookmarks, ${subfolderCount} subfolders`);

        } catch (error) {
          console.warn(`Could not access folder "${folder.title}":`, error);
          folderContents.set(folder.id, []);
        }
      }

      // Second pass: determine which folders are truly empty (recursively)
      const isEmptyRecursively = (folderId, visited = new Set()) => {
        if (visited.has(folderId)) return true; // Avoid infinite loops
        visited.add(folderId);

        const children = folderContents.get(folderId) || [];

        // If has any bookmarks, not empty
        const hasBookmarks = children.some(child => child.url);
        if (hasBookmarks) return false;

        // If has no children at all, it's empty
        if (children.length === 0) return true;

        // Check if all subfolders are empty
        const subfolders = children.filter(child => !child.url);
        return subfolders.every(subfolder => isEmptyRecursively(subfolder.id, new Set(visited)));
      };

      // Find all empty folders
      for (const folder of allFolders) {
        if (isEmptyRecursively(folder.id)) {
          emptyFolders.push(folder);
        }
      }

      console.log(`Found ${emptyFolders.length} empty folders`);

      if (emptyFolders.length === 0) {
        this.showResults({
          processed: allFolders.length,
          deleted: 0,
          message: 'No empty folders found. All folders contain bookmarks or non-empty subfolders.'
        });
        return;
      }

      // Sort folders by depth (deepest first) to avoid deleting parent before child
      emptyFolders.sort((a, b) => {
        const depthA = a.parentTitle.split(' > ').length;
        const depthB = b.parentTitle.split(' > ').length;
        return depthB - depthA;
      });

      // Delete empty folders
      let deletedCount = 0;
      const errors = [];
      let processedFolders = 0;

      for (const folder of emptyFolders) {
        processedFolders++;
        const progress = Math.round(50 + (processedFolders / emptyFolders.length) * 40);

        this.updateProgress(
          `Deleting empty folder "${folder.title}"... (${processedFolders}/${emptyFolders.length})`,
          progress
        );

        try {
          // Double-check the folder is still empty before deleting
          const currentChildren = await chrome.bookmarks.getChildren(folder.id);
          const hasBookmarks = currentChildren.some(child => child.url);

          if (!hasBookmarks) {
            await chrome.bookmarks.removeTree(folder.id);
            console.log(`Deleted empty folder: "${folder.title}" from "${folder.parentTitle}"`);
            deletedCount++;
          } else {
            console.log(`Skipped folder "${folder.title}" - no longer empty`);
          }

        } catch (error) {
          console.error(`Failed to delete folder "${folder.title}":`, error);
          errors.push(`${folder.title}: ${error.message}`);
        }

        // Small delay to prevent overwhelming the API
        if (processedFolders < emptyFolders.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Show results
      const resultMessage = errors.length > 0
        ? `Deleted ${deletedCount} empty folders. ${errors.length} failed to delete.`
        : `Successfully deleted ${deletedCount} empty folders.`;

      this.showResults({
        processed: allFolders.length,
        deleted: deletedCount,
        errors: errors.length,
        message: resultMessage,
        details: errors.length > 0 ? `Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}` : null
      });

      // Refresh stats after deleting folders
      await this.loadStats();

    } catch (error) {
      console.error('Popup: Delete empty folders error:', error);
      this.showError(`Failed to delete empty folders: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Remove duplicate URLs (same webpage with different fragments/anchors)
   */
  async removeDuplicateUrls() {
    if (this.isProcessing) return;

    // Show confirmation dialog
    const confirmed = confirm(
      'This will scan all bookmarks and remove duplicates that point to the same webpage.\n\n' +
      'Examples of duplicates that will be removed:\n' +
      '• https://example.com/page#section1\n' +
      '• https://example.com/page#section2\n' +
      '(Both point to the same page, one will be kept)\n\n' +
      'This action cannot be undone automatically.\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) return;

    this.isProcessing = true;
    this.showProgress();
    this.updateProgress('Scanning for duplicate URLs...', 0);

    try {
      console.log('Popup: Starting duplicate URL removal...');

      // Get all bookmarks
      const bookmarkTree = await chrome.bookmarks.getTree();
      const allBookmarks = [];

      // Collect all bookmarks from all folders
      const collectBookmarksFromTree = (nodes, parentTitle = '') => {
        for (const node of nodes) {
          if (node.url) {
            allBookmarks.push({
              id: node.id,
              title: node.title,
              url: node.url,
              parentId: node.parentId,
              currentFolder: parentTitle
            });
          }
          if (node.children) {
            collectBookmarksFromTree(node.children, node.title);
          }
        }
      };

      collectBookmarksFromTree(bookmarkTree);

      console.log(`Found ${allBookmarks.length} total bookmarks to analyze`);
      this.updateProgress(`Analyzing ${allBookmarks.length} bookmarks for duplicates...`, 10);

      if (allBookmarks.length === 0) {
        this.showResults({
          processed: 0,
          removed: 0,
          message: 'No bookmarks found to analyze.'
        });
        return;
      }

      // Group bookmarks by normalized URL (without fragments, query params, etc.)
      const urlGroups = new Map();
      const duplicateGroups = [];

      for (let i = 0; i < allBookmarks.length; i++) {
        const bookmark = allBookmarks[i];
        const progress = Math.round(10 + (i / allBookmarks.length) * 40);

        this.updateProgress(`Analyzing "${bookmark.title}"... (${i + 1}/${allBookmarks.length})`, progress);

        try {
          // Normalize URL by removing fragments, query parameters, and trailing slashes
          const url = new URL(bookmark.url);
          const normalizedUrl = `${url.protocol}//${url.hostname}${url.pathname}`.replace(/\/$/, '');

          if (!urlGroups.has(normalizedUrl)) {
            urlGroups.set(normalizedUrl, []);
          }

          urlGroups.get(normalizedUrl).push(bookmark);
        } catch (error) {
          console.warn(`Invalid URL for bookmark "${bookmark.title}": ${bookmark.url}`);
          // Keep invalid URLs as unique
          const invalidKey = `invalid_${bookmark.url}`;
          urlGroups.set(invalidKey, [bookmark]);
        }
      }

      // Find groups with duplicates
      for (const [normalizedUrl, bookmarks] of urlGroups) {
        if (bookmarks.length > 1) {
          duplicateGroups.push({
            normalizedUrl,
            bookmarks,
            duplicateCount: bookmarks.length - 1
          });
        }
      }

      console.log(`Found ${duplicateGroups.length} groups with duplicates`);

      if (duplicateGroups.length === 0) {
        this.showResults({
          processed: allBookmarks.length,
          removed: 0,
          message: 'No duplicate URLs found. All bookmarks point to unique webpages.'
        });
        return;
      }

      // Remove duplicates (keep the first one, remove the rest)
      let removedCount = 0;
      const errors = [];
      let processedGroups = 0;

      for (const group of duplicateGroups) {
        processedGroups++;
        const progress = Math.round(50 + (processedGroups / duplicateGroups.length) * 40);

        this.updateProgress(
          `Removing duplicates for ${group.normalizedUrl}... (${processedGroups}/${duplicateGroups.length})`,
          progress
        );

        // Sort bookmarks by creation date (keep the oldest) or by title length (keep the most descriptive)
        const sortedBookmarks = group.bookmarks.sort((a, b) => {
          // Prefer bookmarks with longer, more descriptive titles
          const titleDiff = b.title.length - a.title.length;
          if (Math.abs(titleDiff) > 10) return titleDiff;

          // If titles are similar length, prefer the first one found
          return 0;
        });

        const keepBookmark = sortedBookmarks[0];
        const duplicatesToRemove = sortedBookmarks.slice(1);

        console.log(`Keeping: "${keepBookmark.title}" (${keepBookmark.url})`);
        console.log(`Removing ${duplicatesToRemove.length} duplicates:`);

        for (const duplicate of duplicatesToRemove) {
          try {
            console.log(`  - "${duplicate.title}" (${duplicate.url})`);
            await chrome.bookmarks.remove(duplicate.id);
            removedCount++;
          } catch (error) {
            console.error(`Failed to remove duplicate "${duplicate.title}":`, error);
            errors.push(`${duplicate.title}: ${error.message}`);
          }
        }

        // Small delay to prevent overwhelming the API
        if (processedGroups < duplicateGroups.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Show results
      const resultMessage = errors.length > 0
        ? `Removed ${removedCount} duplicate bookmarks. ${errors.length} failed to remove.`
        : `Successfully removed ${removedCount} duplicate bookmarks from ${duplicateGroups.length} groups.`;

      this.showResults({
        processed: allBookmarks.length,
        removed: removedCount,
        groups: duplicateGroups.length,
        errors: errors.length,
        message: resultMessage,
        details: errors.length > 0 ? `Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}` :
          `Found ${duplicateGroups.length} groups of duplicates. Kept the most descriptive bookmark from each group.`
      });

      // Refresh stats after removing duplicates
      await this.loadStats();

    } catch (error) {
      console.error('Popup: Remove duplicates error:', error);
      this.showError(`Failed to remove duplicates: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Move all bookmarks to Bookmark Bar for reprocessing
   */
  async moveAllToBookmarkBar() {
    if (this.isProcessing) return;

    // Show confirmation dialog
    const confirmed = confirm(
      'This will move ALL bookmarks from all folders back to the Bookmark Bar.\n\n' +
      'This action will:\n' +
      '• Move all bookmarks to the root of Bookmark Bar\n' +
      '• Allow you to reprocess them with new categorization\n' +
      '• Cannot be undone automatically\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) return;

    this.isProcessing = true;
    this.showProgress();
    this.updateProgress('Moving bookmarks to Bookmark Bar...', 0);

    try {
      console.log('Popup: Starting move all to bookmark bar...');

      // Get all bookmarks first to show progress
      const bookmarkTree = await chrome.bookmarks.getTree();
      const allBookmarks = [];

      // Collect all bookmarks from all folders
      const collectBookmarksFromTree = (nodes, parentTitle = '') => {
        for (const node of nodes) {
          if (node.url && node.parentId !== '1') { // Only bookmarks not already in Bookmark Bar
            allBookmarks.push({
              id: node.id,
              title: node.title,
              url: node.url,
              parentId: node.parentId,
              currentFolder: parentTitle
            });
          }
          if (node.children) {
            collectBookmarksFromTree(node.children, node.title);
          }
        }
      };

      collectBookmarksFromTree(bookmarkTree);

      console.log(`Found ${allBookmarks.length} bookmarks to move to Bookmark Bar`);

      if (allBookmarks.length === 0) {
        this.showResults({
          processed: 0,
          moved: 0,
          message: 'No bookmarks found to move. All bookmarks are already in the Bookmark Bar.'
        });
        return;
      }

      // Move bookmarks one by one with progress updates
      let movedCount = 0;
      const errors = [];

      for (let i = 0; i < allBookmarks.length; i++) {
        const bookmark = allBookmarks[i];
        const progress = Math.round((i / allBookmarks.length) * 100);

        this.updateProgress(
          `Moving "${bookmark.title}" to Bookmark Bar... (${i + 1}/${allBookmarks.length})`,
          progress
        );

        try {
          // Move bookmark to Bookmark Bar (parentId: '1')
          await chrome.bookmarks.move(bookmark.id, { parentId: '1' });
          movedCount++;
          console.log(`Moved: "${bookmark.title}" from "${bookmark.currentFolder}" to Bookmark Bar`);
        } catch (error) {
          console.error(`Failed to move bookmark "${bookmark.title}":`, error);
          errors.push(`${bookmark.title}: ${error.message}`);
        }

        // Small delay to prevent overwhelming the API
        if (i < allBookmarks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Show results
      const resultMessage = errors.length > 0
        ? `Moved ${movedCount} bookmarks. ${errors.length} failed to move.`
        : `Successfully moved ${movedCount} bookmarks to Bookmark Bar.`;

      this.showResults({
        processed: allBookmarks.length,
        moved: movedCount,
        errors: errors.length,
        message: resultMessage,
        details: errors.length > 0 ? `Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}` : null
      });

      // Refresh stats after moving
      await this.loadStats();

    } catch (error) {
      console.error('Popup: Move to bookmark bar error:', error);
      this.showError(`Failed to move bookmarks: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start bookmark categorization process
   */
  async startCategorization(forceReorganize = false) {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.showProgress();

    try {
      console.log('Popup: Starting categorization...', { forceReorganize });

      const response = await chrome.runtime.sendMessage({
        action: 'startCategorization',
        data: { forceReorganize }
      });

      console.log('Popup: Categorization response:', response);

      if (response && response.success) {
        this.showResults(response.data);
      } else {
        const errorMsg = response?.error || 'Categorization failed - no response';
        console.error('Popup: Categorization failed:', errorMsg);
        this.showError(errorMsg);
      }
    } catch (error) {
      console.error('Popup: Categorization error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      this.showError(`Failed to start categorization: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Export bookmarks organization
   */
  async exportBookmarks() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportBookmarks'
      });

      if (response.success) {
        this.downloadExport(response.data);
      } else {
        this.showError(response.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Failed to export bookmarks');
    }
  }

  /**
   * Download export data as JSON file
   */
  downloadExport(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('Bookmarks exported successfully!');
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Show help information
   */
  showHelp() {
    const helpText = `BookmarkMind Help:

1. Configure your Gemini API key in Settings
2. Click "Sort Bookmarks Now" to organize uncategorized bookmarks
3. The AI will categorize bookmarks into folders like Work, Personal, Shopping, etc.
4. You can customize categories in Settings
5. The extension learns from your manual corrections

Need an API key? Visit: https://makersuite.google.com/app/apikey`;

    alert(helpText);
  }

  /**
   * Test communication with background script
   */
  async testCommunication() {
    console.log('Testing communication with background script...');

    try {
      // Test 1: Ping
      console.log('1. Testing ping...');
      const pingResponse = await chrome.runtime.sendMessage({ action: 'ping' });
      console.log('Ping response:', pingResponse);

      if (!pingResponse) {
        alert('❌ Background script not responding. Please reload the extension.');
        return;
      }

      // Test 2: Stats
      console.log('2. Testing stats...');
      const statsResponse = await chrome.runtime.sendMessage({ action: 'getStats' });
      console.log('Stats response:', statsResponse);

      if (statsResponse && statsResponse.success) {
        alert('✅ Communication working! Background script is responding.');
      } else {
        alert(`❌ Stats failed: ${statsResponse?.error || 'No response'}`);
      }

    } catch (error) {
      console.error('Communication test error:', error);
      alert(`❌ Communication failed: ${error.message}`);
    }
  }

  /**
   * Test categorization process
   */
  async testCategorization() {
    console.log('Testing categorization process...');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startCategorization',
        data: {}
      });

      console.log('Categorization test result:', response);

      if (response.success) {
        this.showResults(response.data);
      } else {
        console.error('Categorization test failed:', response.error);
        alert(`Categorization failed: ${response.error}`);
      }
    } catch (error) {
      console.error('Categorization test error:', error);
      alert(`Test error: ${error.message}`);
    }
  }

  /**
   * Run debug test for bookmark detection
   */
  async runDebugTest() {
    const debugSection = document.getElementById('debugSection');
    debugSection.classList.remove('hidden');

    this.debugResults.innerHTML = '<p>Testing bookmark access...</p>';

    try {
      // Test 1: Direct Chrome API access
      const tree = await chrome.bookmarks.getTree();

      // Test 2: Extract bookmarks
      const bookmarks = [];
      function extractBookmarks(node) {
        if (node.url) {
          bookmarks.push({
            id: node.id,
            title: node.title,
            url: node.url,
            parentId: node.parentId
          });
        }
        if (node.children) {
          node.children.forEach(extractBookmarks);
        }
      }

      extractBookmarks(tree[0]);

      // Test 3: Calculate stats
      const stats = {
        total: bookmarks.length,
        bookmarksBar: bookmarks.filter(b => b.parentId === '1').length,
        otherBookmarks: bookmarks.filter(b => b.parentId === '2').length,
        mobileBookmarks: bookmarks.filter(b => b.parentId === '3').length,
        uncategorized: bookmarks.filter(b => ['1', '2', '3'].includes(b.parentId)).length
      };

      this.debugResults.innerHTML = `
        <div style="background: #e8f5e8; padding: 10px; border-radius: 4px; font-size: 12px;">
          <strong>✓ Bookmark Access Successful!</strong><br>
          Total Bookmarks: ${stats.total}<br>
          Bookmarks Bar: ${stats.bookmarksBar}<br>
          Other Bookmarks: ${stats.otherBookmarks}<br>
          Mobile Bookmarks: ${stats.mobileBookmarks}<br>
          <strong>Uncategorized: ${stats.uncategorized}</strong><br><br>

          ${stats.uncategorized > 0 ?
          '<strong style="color: green;">✓ Should enable sort button</strong>' :
          '<strong style="color: orange;">⚠ No uncategorized bookmarks found</strong>'
        }
        </div>
      `;

      // Update stats if they were wrong
      if (stats.uncategorized > 0 && this.stats.uncategorized === 0) {
        this.stats = {
          totalBookmarks: stats.total,
          uncategorized: stats.uncategorized,
          totalFolders: 0
        };
        this.updateUI();
      }

    } catch (error) {
      this.debugResults.innerHTML = `
        <div style="background: #ffebee; padding: 10px; border-radius: 4px; font-size: 12px;">
          <strong>✗ Bookmark Access Failed!</strong><br>
          Error: ${error.message}<br><br>
          This indicates a permission issue. Try:<br>
          1. Reload the extension<br>
          2. Check extension permissions<br>
          3. See BOOKMARK_DETECTION_DEBUG.md
        </div>
      `;
    }
  }

  /**
   * Show progress section
   */
  showProgress() {
    this.actionSection.classList.add('hidden');
    this.resultsSection.classList.add('hidden');
    this.progressSection.classList.remove('hidden');

    this.updateProgress({ stage: 'starting', progress: 0 });
  }

  /**
   * Update progress display
   */
  updateProgress(progressOrText, percent) {
    // Handle both object format and separate parameters
    if (typeof progressOrText === 'object') {
      const { stage, progress: progressPercent } = progressOrText;

      const stageTexts = {
        starting: 'Preparing to organize...',
        loading: 'Loading bookmarks...',
        categorizing: 'AI is categorizing bookmarks...',
        organizing: 'Moving bookmarks to folders...',
        complete: 'Organization complete!'
      };

      this.progressText.textContent = stageTexts[stage] || 'Processing...';
      this.progressPercent.textContent = `${Math.round(progressPercent)}%`;
      this.progressFill.style.width = `${progressPercent}%`;
    } else {
      // Handle direct text and percent parameters
      this.progressText.textContent = progressOrText;
      this.progressPercent.textContent = `${Math.round(percent)}%`;
      this.progressFill.style.width = `${percent}%`;
    }
  }

  /**
   * Show results section
   */
  showResults(results) {
    this.progressSection.classList.add('hidden');
    this.resultsSection.classList.remove('hidden');

    // Handle delete empty folders results
    if (results.deleted !== undefined) {
      this.resultsTitle.textContent = 'Empty Folders Deleted!';
      this.resultsMessage.textContent = results.message;

      if (results.details) {
        this.resultsMessage.textContent += `\n\n${results.details}`;
      }

      // Update stats display
      this.processedCount.textContent = results.processed || 0;
      this.categorizedCount.textContent = results.deleted || 0;

      // Change the label for deleted folders
      const categorizedLabel = this.categorizedCount.nextElementSibling;
      if (categorizedLabel) {
        categorizedLabel.textContent = 'Deleted';
      }

      return;
    }

    // Handle duplicate removal results
    if (results.removed !== undefined) {
      this.resultsTitle.textContent = 'Duplicates Removed!';
      this.resultsMessage.textContent = results.message;

      if (results.details) {
        this.resultsMessage.textContent += `\n\n${results.details}`;
      }

      // Update stats display
      this.processedCount.textContent = results.processed || 0;
      this.categorizedCount.textContent = results.removed || 0;

      // Change the label for removed bookmarks
      const categorizedLabel = this.categorizedCount.nextElementSibling;
      if (categorizedLabel) {
        categorizedLabel.textContent = 'Removed';
      }

      return;
    }

    // Handle move to bookmark bar results
    if (results.moved !== undefined) {
      this.resultsTitle.textContent = 'Bookmarks Moved!';
      this.resultsMessage.textContent = results.message;

      if (results.details) {
        this.resultsMessage.textContent += `\n\n${results.details}`;
      }

      // Update stats display
      this.processedCount.textContent = results.processed || 0;
      this.categorizedCount.textContent = results.moved || 0;

      // Change the label for moved bookmarks
      const categorizedLabel = this.categorizedCount.nextElementSibling;
      if (categorizedLabel) {
        categorizedLabel.textContent = 'Moved';
      }

      return;
    }

    // Handle categorization results
    if (results.message) {
      // Special case for "already organized" message
      this.resultsTitle.textContent = 'Already Organized!';
      this.resultsMessage.textContent = results.message;
    } else {
      this.resultsTitle.textContent = 'Bookmarks Organized!';
      const categoryCount = results.categories?.size || results.generatedCategories?.length || 0;
      this.resultsMessage.textContent = `Successfully organized ${results.categorized} bookmarks into ${categoryCount} AI-generated categories.`;

      // Show generated hierarchical categories if available
      if (results.generatedCategories && results.generatedCategories.length > 0) {
        const hierarchicalCategories = results.generatedCategories.filter(cat => cat !== 'Other');
        const topLevelCategories = [...new Set(hierarchicalCategories.map(cat => cat.split(' > ')[0]))];

        this.resultsMessage.textContent += `\n\nGenerated ${hierarchicalCategories.length} hierarchical categories across ${topLevelCategories.length} main areas:`;
        this.resultsMessage.textContent += `\n${topLevelCategories.join(', ')}`;

        // Show depth analysis
        const depthCounts = {};
        hierarchicalCategories.forEach(cat => {
          const depth = cat.split(' > ').length;
          depthCounts[depth] = (depthCounts[depth] || 0) + 1;
        });

        const depthInfo = Object.entries(depthCounts)
          .map(([depth, count]) => `${count} at ${depth} levels`)
          .join(', ');
        this.resultsMessage.textContent += `\n(${depthInfo})`;
      }
    }

    this.processedCount.textContent = results.processed || 0;
    this.categorizedCount.textContent = results.categorized || 0;

    // Refresh stats and UI after successful categorization
    setTimeout(() => {
      this.loadStats().then(() => this.updateUI());
    }, 1000);

    // Auto-hide results after 5 seconds
    setTimeout(() => {
      this.hideResults();
    }, 5000);
  }

  /**
   * Hide results and show main interface
   */
  hideResults() {
    this.resultsSection.classList.add('hidden');
    this.actionSection.classList.remove('hidden');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.progressSection.classList.add('hidden');
    this.resultsSection.classList.remove('hidden');

    // Update results section to show error
    const resultIcon = this.resultsSection.querySelector('.result-icon');
    resultIcon.classList.remove('success');
    resultIcon.classList.add('error');
    resultIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#f44336"/>
      </svg>
    `;

    this.resultsTitle.textContent = 'Error';
    this.resultsMessage.textContent = message;
    this.processedCount.textContent = '0';
    this.categorizedCount.textContent = '0';

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      this.hideResults();
      // Reset result icon back to success state
      const resultIcon = this.resultsSection.querySelector('.result-icon');
      resultIcon.classList.remove('error');
      resultIcon.classList.add('success');
      resultIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#4caf50"/>
        </svg>
      `;
    }, 5000);
  }

  /**
   * Update extension status indicator
   */
  updateExtensionStatus() {
    if (!this.statusDot || !this.statusText) return;

    const totalBookmarks = this.stats.totalBookmarks || 0;
    const uncategorized = this.stats.uncategorized || 0;
    const hasApiKey = this.settings.apiKey;

    if (totalBookmarks === 0) {
      this.statusDot.className = 'status-dot error';
      this.statusText.textContent = 'No bookmarks detected';
    } else if (!hasApiKey) {
      this.statusDot.className = 'status-dot warning';
      this.statusText.textContent = 'API key required';
    } else if (uncategorized === 0) {
      this.statusDot.className = 'status-dot success';
      this.statusText.textContent = 'All bookmarks organized';
    } else {
      this.statusDot.className = 'status-dot success';
      this.statusText.textContent = `Ready to organize ${uncategorized} bookmarks`;
    }
  }

  /**
   * Show notification message
   */
  showNotification(message) {
    // Simple notification - could be enhanced with a toast system
    console.log('Notification:', message);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});