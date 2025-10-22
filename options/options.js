/**
 * BookmarkMind - Options Page Script
 * Handles settings page functionality and user preferences
 */

class OptionsController {
  constructor() {
    this.settings = {};
    this.stats = {};
    this.isApiKeyVisible = false;

    this.initializeElements();
    this.attachEventListeners();
    this.loadSettings();
    this.loadStats();

    // Debug: Check if all elements were found
    console.log('Options controller initialized:', {
      apiKeyInput: !!this.apiKeyInput,
      toggleBtn: !!this.toggleApiKeyBtn,
      clearBtn: !!this.clearApiKeyBtn,
      testBtn: !!this.testApiKeyBtn,
      saveBtn: !!this.saveApiKeyBtn
    });
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // API Key elements
    this.apiKeyInput = document.getElementById('apiKey');
    this.toggleApiKeyBtn = document.getElementById('toggleApiKey');
    this.clearApiKeyBtn = document.getElementById('clearApiKey');
    this.testApiKeyBtn = document.getElementById('testApiKey');
    this.saveApiKeyBtn = document.getElementById('saveApiKey');
    this.apiKeyStatus = document.getElementById('apiKeyStatus');

    // Categories elements
    this.categoriesList = document.getElementById('categoriesList');
    this.newCategoryInput = document.getElementById('newCategoryInput');
    this.addCategoryBtn = document.getElementById('addCategoryBtn');

    // Settings elements
    this.batchSizeSelect = document.getElementById('batchSize');
    this.cleanupEmptyFoldersCheckbox = document.getElementById('cleanupEmptyFolders');

    // Stats elements
    this.totalBookmarksCount = document.getElementById('totalBookmarksCount');
    this.organizedBookmarksCount = document.getElementById('organizedBookmarksCount');
    this.categoriesCount = document.getElementById('categoriesCount');
    this.learningPatternsCount = document.getElementById('learningPatternsCount');
    this.lastSortDate = document.getElementById('lastSortDate');

    // Data management elements
    this.exportDataBtn = document.getElementById('exportData');
    this.clearLearningDataBtn = document.getElementById('clearLearningData');
    this.resetSettingsBtn = document.getElementById('resetSettings');

    // Toast notification
    this.toast = document.getElementById('toast');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // API Key events
    this.apiKeyInput.addEventListener('input', () => {
      console.log('Input event triggered');
      this.onApiKeyChange();
    });
    this.toggleApiKeyBtn.addEventListener('click', () => {
      console.log('Toggle button clicked');
      this.toggleApiKeyVisibility();
    });
    this.clearApiKeyBtn.addEventListener('click', () => {
      console.log('Clear button clicked');
      this.clearApiKey();
    });
    this.testApiKeyBtn.addEventListener('click', () => {
      console.log('Test button clicked');
      this.testApiKey();
    });
    this.saveApiKeyBtn.addEventListener('click', () => {
      console.log('Save button clicked');
      this.saveApiKey();
    });

    // Categories events
    this.newCategoryInput.addEventListener('input', () => this.onNewCategoryChange());
    this.newCategoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCategory();
    });
    this.addCategoryBtn.addEventListener('click', () => this.addCategory());

    // Settings events
    this.batchSizeSelect.addEventListener('change', () => this.saveSettings());
    this.cleanupEmptyFoldersCheckbox.addEventListener('change', () => this.saveSettings());

    // Data management events
    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.clearLearningDataBtn.addEventListener('click', () => this.clearLearningData());
    this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
  }

  /**
   * Load user settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['bookmarkMindSettings']);
      this.settings = result.bookmarkMindSettings || this.getDefaultSettings();
      this.updateSettingsUI();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  /**
   * Load statistics
   */
  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (response.success) {
        this.stats = response.data;
        this.updateStatsUI();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      apiKey: '',
      categories: ['Work', 'Personal', 'Shopping', 'Entertainment', 'News', 'Social', 'Learning', 'Other'],
      lastSortTime: 0,
      batchSize: 50,
      cleanupEmptyFolders: false
    };
  }

  /**
   * Update settings UI with current values
   */
  updateSettingsUI() {
    // API Key (show masked or empty)
    if (this.settings.apiKey) {
      this.apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••';
      this.apiKeyInput.dataset.hasKey = 'true';
      this.apiKeyInput.type = 'password';
    } else {
      this.apiKeyInput.value = '';
      this.apiKeyInput.dataset.hasKey = 'false';
      this.apiKeyInput.type = 'password';
    }

    // Categories
    this.renderCategories();

    // Advanced settings
    this.batchSizeSelect.value = this.settings.batchSize || 50;
    this.cleanupEmptyFoldersCheckbox.checked = this.settings.cleanupEmptyFolders !== false;

    // Update button states after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.updateButtonStates();

      // If no API key is stored, make sure buttons can be enabled when user types
      if (!this.settings.apiKey) {
        this.testApiKeyBtn.disabled = true;
        this.saveApiKeyBtn.disabled = true;
        console.log('No stored API key - buttons disabled until valid input');
      }
    }, 100);
  }

  /**
   * Update statistics UI
   */
  updateStatsUI() {
    this.totalBookmarksCount.textContent = this.stats.totalBookmarks || 0;
    this.organizedBookmarksCount.textContent = (this.stats.totalBookmarks || 0) - (this.stats.uncategorized || 0);
    this.categoriesCount.textContent = this.stats.categories || 0;
    this.learningPatternsCount.textContent = this.stats.learningPatterns || 0;

    if (this.stats.lastSortTime) {
      const date = new Date(this.stats.lastSortTime);
      this.lastSortDate.textContent = date.toLocaleString();
    } else {
      this.lastSortDate.textContent = 'Never';
    }
  }

  /**
   * Render categories list
   */
  renderCategories() {
    this.categoriesList.innerHTML = '';

    this.settings.categories.forEach((category, index) => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <span class="category-name">${this.escapeHtml(category)}</span>
        <div class="category-actions">
          <button class="category-btn edit" title="Edit category" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="category-btn delete" title="Delete category" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      `;

      // Attach event listeners for category actions
      const editBtn = categoryItem.querySelector('.edit');
      const deleteBtn = categoryItem.querySelector('.delete');

      editBtn.addEventListener('click', () => this.editCategory(index));
      deleteBtn.addEventListener('click', () => this.deleteCategory(index));

      this.categoriesList.appendChild(categoryItem);
    });
  }

  /**
   * Handle API key input change
   */
  onApiKeyChange() {
    const value = this.apiKeyInput.value.trim();
    const hasValue = value.length > 0;
    const isPlaceholder = value.startsWith('••••');

    // Validate API key format
    const isValidFormat = value.startsWith('AIza') && value.length >= 35;
    const shouldEnable = hasValue && !isPlaceholder && isValidFormat;

    this.testApiKeyBtn.disabled = !shouldEnable;
    this.saveApiKeyBtn.disabled = !shouldEnable;

    // Show format hint if user is typing but format is wrong
    if (hasValue && !isPlaceholder && !isValidFormat) {
      this.showApiKeyStatus('API key should start with "AIza" and be ~39 characters long', 'error');
    } else if (!isPlaceholder && hasValue && isValidFormat) {
      this.hideApiKeyStatus();
    }

    // Debug logging
    console.log('API Key input changed:', {
      valueLength: value.length,
      hasValue,
      isPlaceholder,
      isValidFormat,
      shouldEnable,
      startsWithAIza: value.startsWith('AIza')
    });
  }

  /**
   * Clear API key input
   */
  clearApiKey() {
    this.apiKeyInput.value = '';
    this.apiKeyInput.type = 'password';
    this.apiKeyInput.dataset.hasKey = 'false';
    this.isApiKeyVisible = false;
    this.hideApiKeyStatus();
    this.updateButtonStates();
    this.apiKeyInput.focus();
    console.log('API key input cleared');
  }

  /**
   * Toggle API key visibility
   */
  toggleApiKeyVisibility() {
    if (this.isApiKeyVisible) {
      // Hide API key
      if (this.settings.apiKey) {
        this.apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••';
        this.apiKeyInput.type = 'password';
      }
      this.toggleApiKeyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
        </svg>
      `;
    } else {
      // Show API key
      if (this.settings.apiKey) {
        this.apiKeyInput.value = this.settings.apiKey;
        this.apiKeyInput.type = 'text';
      }
      this.toggleApiKeyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 7C12.55 7 13 7.45 13 8C13 8.55 12.55 9 12 9C11.45 9 11 8.55 11 8C11 7.45 11.45 7 12 7ZM2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12ZM12 17C15.87 17 19.5 13.87 19.5 12C19.5 10.13 15.87 7 12 7C8.13 7 4.5 10.13 4.5 12C4.5 13.87 8.13 17 12 17Z" fill="currentColor"/>
          <path d="M3 3L21 21" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
    }
    this.isApiKeyVisible = !this.isApiKeyVisible;
    this.updateButtonStates();
  }

  /**
   * Test API key validity
   */
  async testApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    if (!apiKey || apiKey.startsWith('••••')) return;

    this.showApiKeyStatus('Testing API key...', 'loading');
    this.testApiKeyBtn.disabled = true;

    try {
      console.log('Testing API key:', apiKey.substring(0, 10) + '...');

      // Add timeout to prevent hanging
      const messagePromise = chrome.runtime.sendMessage({
        action: 'testApiKey',
        data: { apiKey }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API key test timeout after 15 seconds')), 15000);
      });

      const response = await Promise.race([messagePromise, timeoutPromise]);

      console.log('API key test response:', response);

      if (response && response.success && response.valid) {
        this.showApiKeyStatus('API key is valid!', 'success');
      } else if (response && !response.success) {
        console.error('API key test failed:', response.error);
        this.showApiKeyStatus(`Test failed: ${response.error}`, 'error');
      } else {
        this.showApiKeyStatus('Invalid API key. Please check your key.', 'error');
      }
    } catch (error) {
      console.error('API key test error:', error);
      this.showApiKeyStatus(`Failed to test API key: ${error.message}`, 'error');
    } finally {
      this.testApiKeyBtn.disabled = false;
    }
  }

  /**
   * Save API key
   */
  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    if (!apiKey || apiKey.startsWith('••••')) return;

    try {
      this.settings.apiKey = apiKey;
      await chrome.storage.sync.set({ bookmarkMindSettings: this.settings });

      this.showToast('API key saved successfully!', 'success');
      this.showApiKeyStatus('API key saved', 'success');

      // Update UI to show masked key
      setTimeout(() => {
        this.apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••';
        this.apiKeyInput.type = 'password';
        this.apiKeyInput.dataset.hasKey = 'true';
        this.isApiKeyVisible = false;
        this.updateButtonStates();
      }, 1000);

    } catch (error) {
      console.error('Error saving API key:', error);
      this.showToast('Failed to save API key', 'error');
    }
  }

  /**
   * Show/hide API key status
   */
  showApiKeyStatus(message, type) {
    this.apiKeyStatus.className = `status-indicator ${type}`;
    this.apiKeyStatus.querySelector('.status-text').textContent = message;
    this.apiKeyStatus.classList.remove('hidden');
  }

  hideApiKeyStatus() {
    this.apiKeyStatus.classList.add('hidden');
  }

  /**
   * Handle new category input change
   */
  onNewCategoryChange() {
    const value = this.newCategoryInput.value.trim();
    this.addCategoryBtn.disabled = !value || this.settings.categories.includes(value);
  }

  /**
   * Add new category
   */
  addCategory() {
    const categoryName = this.newCategoryInput.value.trim();
    if (!categoryName || this.settings.categories.includes(categoryName)) return;

    this.settings.categories.push(categoryName);
    this.newCategoryInput.value = '';
    this.addCategoryBtn.disabled = true;

    this.renderCategories();
    this.saveSettings();
    this.showToast(`Category "${categoryName}" added!`, 'success');
  }

  /**
   * Edit category
   */
  editCategory(index) {
    const currentName = this.settings.categories[index];
    const newName = prompt('Edit category name:', currentName);

    if (newName && newName.trim() && newName !== currentName) {
      const trimmedName = newName.trim();

      // Check for duplicates
      if (this.settings.categories.includes(trimmedName)) {
        this.showToast('Category already exists!', 'error');
        return;
      }

      this.settings.categories[index] = trimmedName;
      this.renderCategories();
      this.saveSettings();
      this.showToast(`Category renamed to "${trimmedName}"`, 'success');
    }
  }

  /**
   * Delete category
   */
  deleteCategory(index) {
    const categoryName = this.settings.categories[index];

    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      this.settings.categories.splice(index, 1);
      this.renderCategories();
      this.saveSettings();
      this.showToast(`Category "${categoryName}" deleted`, 'success');
    }
  }

  /**
   * Save all settings
   */
  async saveSettings() {
    try {
      // Update settings from UI
      this.settings.batchSize = parseInt(this.batchSizeSelect.value);
      this.settings.cleanupEmptyFolders = this.cleanupEmptyFoldersCheckbox.checked;

      await chrome.storage.sync.set({ bookmarkMindSettings: this.settings });
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  /**
   * Export extension data
   */
  async exportData() {
    try {
      const allData = await chrome.storage.sync.get(null);
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        settings: allData.bookmarkMindSettings || {},
        learningData: allData.bookmarkMindLearning || {}
      };

      // Remove sensitive data
      if (exportData.settings.apiKey) {
        exportData.settings.apiKey = '[REDACTED]';
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarkmind-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast('Settings exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Failed to export settings', 'error');
    }
  }

  /**
   * Clear learning data
   */
  async clearLearningData() {
    if (confirm('Are you sure you want to clear all learning data? This will reset the AI\'s learned preferences.')) {
      try {
        await chrome.storage.sync.set({ bookmarkMindLearning: {} });
        this.showToast('Learning data cleared', 'success');
        this.loadStats(); // Refresh stats
      } catch (error) {
        console.error('Error clearing learning data:', error);
        this.showToast('Failed to clear learning data', 'error');
      }
    }
  }

  /**
   * Reset all settings
   */
  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This will clear your API key and custom categories.')) {
      try {
        const defaultSettings = this.getDefaultSettings();
        await chrome.storage.sync.set({
          bookmarkMindSettings: defaultSettings,
          bookmarkMindLearning: {}
        });

        this.settings = defaultSettings;
        this.updateSettingsUI();
        this.showToast('Settings reset to defaults', 'success');
        this.loadStats(); // Refresh stats
      } catch (error) {
        console.error('Error resetting settings:', error);
        this.showToast('Failed to reset settings', 'error');
      }
    }
  }

  /**
   * Update button states
   */
  updateButtonStates() {
    const currentValue = this.apiKeyInput.value.trim();
    const isPlaceholder = currentValue.startsWith('••••');
    const hasRealValue = currentValue.length > 0 && !isPlaceholder;
    const looksLikeApiKey = currentValue.startsWith('AIza') || currentValue.length > 20;

    const shouldEnable = hasRealValue && looksLikeApiKey;

    this.testApiKeyBtn.disabled = !shouldEnable;
    this.saveApiKeyBtn.disabled = !shouldEnable;

    console.log('Button states updated:', {
      currentValueLength: currentValue.length,
      isPlaceholder,
      hasRealValue,
      looksLikeApiKey,
      shouldEnable
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'success') {
    this.toast.className = `toast ${type}`;
    this.toast.querySelector('.toast-message').textContent = message;
    this.toast.classList.add('show');

    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3000);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});