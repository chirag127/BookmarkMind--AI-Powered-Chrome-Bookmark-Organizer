/**
 * BookmarkMind - Snapshot Manager
 * Handles versioned snapshots of bookmark state for undo/rollback functionality
 */

class SnapshotManager {
  constructor() {
    this.maxSnapshots = 10;
    this.storageKey = 'bookmarkMindSnapshots';
  }

  /**
   * Create a snapshot of current bookmark state
   * @param {string} description - Description of what operation this snapshot is for
   * @param {Object} metadata - Additional metadata (e.g., operation type, bookmark count)
   * @returns {Promise<Object>} Created snapshot object
   */
  async createSnapshot(description, metadata = {}) {
    try {
      console.log(`📸 Creating snapshot: ${description}`);
      
      const tree = await chrome.bookmarks.getTree();
      
      const snapshot = {
        id: this._generateSnapshotId(),
        timestamp: Date.now(),
        description: description,
        metadata: metadata,
        bookmarkTree: tree[0]
      };

      await this._saveSnapshot(snapshot);
      
      console.log(`✅ Snapshot created: ${snapshot.id}`);
      return snapshot;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }
  }

  /**
   * Get all available snapshots
   * @returns {Promise<Array>} Array of snapshot metadata (without full tree data)
   */
  async getSnapshots() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const snapshots = result[this.storageKey] || [];
      
      return snapshots.map(snapshot => ({
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        description: snapshot.description,
        metadata: snapshot.metadata
      }));
    } catch (error) {
      console.error('Error getting snapshots:', error);
      return [];
    }
  }

  /**
   * Get a specific snapshot by ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object|null>} Snapshot object or null if not found
   */
  async getSnapshot(snapshotId) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const snapshots = result[this.storageKey] || [];
      
      return snapshots.find(s => s.id === snapshotId) || null;
    } catch (error) {
      console.error('Error getting snapshot:', error);
      return null;
    }
  }

  /**
   * Restore bookmarks from a snapshot
   * @param {string} snapshotId - Snapshot ID to restore
   * @param {Function} progressCallback - Progress update callback
   * @returns {Promise<Object>} Restoration results
   */
  async restoreSnapshot(snapshotId, progressCallback) {
    try {
      console.log(`🔄 Restoring snapshot: ${snapshotId}`);
      progressCallback?.({ stage: 'loading', progress: 0, message: 'Loading snapshot...' });

      const snapshot = await this.getSnapshot(snapshotId);
      if (!snapshot) {
        throw new Error('Snapshot not found');
      }

      progressCallback?.({ stage: 'preparing', progress: 10, message: 'Preparing restoration...' });

      const currentTree = await chrome.bookmarks.getTree();
      const results = {
        foldersCreated: 0,
        foldersDeleted: 0,
        bookmarksRestored: 0,
        bookmarksRemoved: 0,
        errors: []
      };

      progressCallback?.({ stage: 'clearing', progress: 20, message: 'Clearing current bookmarks...' });
      await this._clearCurrentBookmarks(currentTree[0], results, progressCallback);

      progressCallback?.({ stage: 'restoring', progress: 50, message: 'Restoring bookmarks...' });
      await this._restoreBookmarkTree(snapshot.bookmarkTree, results, progressCallback);

      progressCallback?.({ stage: 'complete', progress: 100, message: 'Restoration complete' });
      
      console.log(`✅ Snapshot restored successfully:`, results);
      return results;
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      throw new Error(`Failed to restore snapshot: ${error.message}`);
    }
  }

  /**
   * Delete a snapshot
   * @param {string} snapshotId - Snapshot ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteSnapshot(snapshotId) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const snapshots = result[this.storageKey] || [];
      
      const filteredSnapshots = snapshots.filter(s => s.id !== snapshotId);
      
      await chrome.storage.local.set({
        [this.storageKey]: filteredSnapshots
      });
      
      console.log(`🗑️ Snapshot deleted: ${snapshotId}`);
      return true;
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      return false;
    }
  }

  /**
   * Clear all snapshots
   * @returns {Promise<boolean>} Success status
   */
  async clearAllSnapshots() {
    try {
      await chrome.storage.local.set({
        [this.storageKey]: []
      });
      
      console.log('🗑️ All snapshots cleared');
      return true;
    } catch (error) {
      console.error('Error clearing snapshots:', error);
      return false;
    }
  }

  /**
   * Save snapshot to storage (with size limit management)
   * @private
   */
  async _saveSnapshot(snapshot) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      let snapshots = result[this.storageKey] || [];
      
      snapshots.push(snapshot);
      
      snapshots.sort((a, b) => b.timestamp - a.timestamp);
      
      if (snapshots.length > this.maxSnapshots) {
        console.log(`📦 Removing old snapshots (keeping ${this.maxSnapshots} most recent)`);
        snapshots = snapshots.slice(0, this.maxSnapshots);
      }
      
      await chrome.storage.local.set({
        [this.storageKey]: snapshots
      });
    } catch (error) {
      if (error.message && error.message.includes('QUOTA_BYTES')) {
        console.warn('Storage quota exceeded, removing oldest snapshots...');
        await this._handleQuotaExceeded(snapshot);
      } else {
        throw error;
      }
    }
  }

  /**
   * Handle storage quota exceeded by removing old snapshots
   * @private
   */
  async _handleQuotaExceeded(newSnapshot) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      let snapshots = result[this.storageKey] || [];
      
      snapshots.push(newSnapshot);
      snapshots.sort((a, b) => b.timestamp - a.timestamp);
      
      let savedSuccessfully = false;
      let keepCount = Math.min(snapshots.length - 1, 5);
      
      while (!savedSuccessfully && keepCount > 0) {
        const trimmedSnapshots = snapshots.slice(0, keepCount);
        
        try {
          await chrome.storage.local.set({
            [this.storageKey]: trimmedSnapshots
          });
          savedSuccessfully = true;
          console.log(`✅ Saved snapshot with ${keepCount} total snapshots`);
        } catch (error) {
          keepCount--;
        }
      }
      
      if (!savedSuccessfully) {
        throw new Error('Unable to save snapshot even after removing old snapshots');
      }
    } catch (error) {
      console.error('Error handling quota exceeded:', error);
      throw error;
    }
  }

  /**
   * Clear current bookmarks (except root folders)
   * @private
   */
  async _clearCurrentBookmarks(rootNode, results, progressCallback) {
    const queue = [];
    
    if (rootNode.children) {
      for (const child of rootNode.children) {
        if (['1', '2', '3'].includes(child.id)) {
          if (child.children) {
            queue.push(...child.children);
          }
        }
      }
    }
    
    const total = queue.length;
    let processed = 0;
    
    for (const node of queue) {
      try {
        await chrome.bookmarks.removeTree(node.id);
        
        if (node.url) {
          results.bookmarksRemoved++;
        } else {
          results.foldersDeleted++;
        }
        
        processed++;
        const progress = 20 + Math.floor((processed / total) * 30);
        progressCallback?.({ stage: 'clearing', progress, message: `Clearing... (${processed}/${total})` });
      } catch (error) {
        console.warn(`Failed to remove node ${node.id}:`, error);
        results.errors.push(`Failed to remove: ${node.title || node.url}`);
      }
    }
  }

  /**
   * Restore bookmark tree from snapshot
   * @private
   */
  async _restoreBookmarkTree(snapshotTree, results, progressCallback) {
    const folderMap = new Map();
    folderMap.set('0', '0');
    folderMap.set('1', '1');
    folderMap.set('2', '2'); 
    folderMap.set('3', '3');
    
    const allNodes = [];
    const collectNodes = (node, depth = 0) => {
      if (node.id !== '0' && !['1', '2', '3'].includes(node.id)) {
        allNodes.push({ node, depth });
      }
      if (node.children) {
        node.children.forEach(child => collectNodes(child, depth + 1));
      }
    };
    
    collectNodes(snapshotTree);
    
    allNodes.sort((a, b) => a.depth - b.depth);
    
    const total = allNodes.length;
    let processed = 0;
    
    for (const { node } of allNodes) {
      try {
        const parentId = folderMap.get(node.parentId);
        
        if (!parentId) {
          console.warn(`Parent not found for node ${node.id}, skipping...`);
          continue;
        }
        
        if (node.url) {
          const bookmark = await chrome.bookmarks.create({
            parentId: parentId,
            title: node.title,
            url: node.url,
            index: node.index
          });
          
          results.bookmarksRestored++;
          folderMap.set(node.id, bookmark.id);
        } else {
          const folder = await chrome.bookmarks.create({
            parentId: parentId,
            title: node.title,
            index: node.index
          });
          
          results.foldersCreated++;
          folderMap.set(node.id, folder.id);
        }
        
        processed++;
        const progress = 50 + Math.floor((processed / total) * 45);
        progressCallback?.({ stage: 'restoring', progress, message: `Restoring... (${processed}/${total})` });
      } catch (error) {
        console.error(`Failed to restore node ${node.id}:`, error);
        results.errors.push(`Failed to restore: ${node.title || node.url}`);
      }
    }
  }

  /**
   * Generate unique snapshot ID
   * @private
   */
  _generateSnapshotId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage stats
   */
  async getStorageInfo() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const snapshots = result[this.storageKey] || [];
      
      const totalSize = new Blob([JSON.stringify(snapshots)]).size;
      
      return {
        snapshotCount: snapshots.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxSnapshots: this.maxSnapshots
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        snapshotCount: 0,
        totalSizeBytes: 0,
        totalSizeMB: '0.00',
        maxSnapshots: this.maxSnapshots
      };
    }
  }
}

if (typeof window !== 'undefined') {
  window.SnapshotManager = SnapshotManager;
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.SnapshotManager = SnapshotManager;
}
