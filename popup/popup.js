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
    this.exportBtn = document.getElementById('exportBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.helpLink = document.getElementById('helpLink');
    this.debugBtn = document.getElementById('debugBtn');
    this.debugResults = document.getElementById('debugResults');

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
    this.exportBtn.addEventListener('click', () => this.exportBookmarks());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
    this.debugBtn.addEventListener('click', () => this.runDebugTest());

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
    console.log('Popup stats:', this.stats); // Debug logging

    if (uncategorizedCount === 0) {
      this.sortBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
        </svg>
        All Organized!
      `;
      this.sortBtn.disabled = true;
    } else {
      this.sortBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 18H9V16H3V18ZM3 6V8H21V6H3ZM3 13H15V11H3V13Z" fill="currentColor"/>
        </svg>
        Sort ${uncategorizedCount} Bookmarks
      `;
      this.sortBtn.disabled = false; // Make sure button is enabled when there are bookmarks
    }
  }

  /**
   * Start bookmark categorization process
   */
  async startCategorization() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.showProgress();

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startCategorization',
        data: {}
      });

      if (response.success) {
        this.showResults(response.data);
      } else {
        this.showError(response.error || 'Categorization failed');
      }
    } catch (error) {
      console.error('Categorization error:', error);
      this.showError('Failed to start categorization');
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
  updateProgress(progress) {
    const { stage, progress: percent } = progress;

    const stageTexts = {
      starting: 'Preparing to organize...',
      loading: 'Loading bookmarks...',
      categorizing: 'AI is categorizing bookmarks...',
      organizing: 'Moving bookmarks to folders...',
      complete: 'Organization complete!'
    };

    this.progressText.textContent = stageTexts[stage] || 'Processing...';
    this.progressPercent.textContent = `${Math.round(percent)}%`;
    this.progressFill.style.width = `${percent}%`;
  }

  /**
   * Show results section
   */
  showResults(results) {
    this.progressSection.classList.add('hidden');
    this.resultsSection.classList.remove('hidden');

    if (results.message) {
      // Special case for "already organized" message
      this.resultsTitle.textContent = 'Already Organized!';
      this.resultsMessage.textContent = results.message;
    } else {
      this.resultsTitle.textContent = 'Bookmarks Organized!';
      this.resultsMessage.textContent = `Successfully organized ${results.categorized} bookmarks into ${results.categories?.size || 0} categories.`;
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