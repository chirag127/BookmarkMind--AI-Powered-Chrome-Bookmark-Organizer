/**
 * BookmarkMind - RedirectResolver Usage Examples
 * Demonstrates how to use the RedirectResolver service with Chrome Bookmarks API
 */

// Example 1: Resolve a single bookmark URL
async function resolveSingleBookmark() {
  console.log('Example 1: Resolve Single Bookmark');
  console.log('===================================\n');

  const resolver = new RedirectResolver();

  // Example bookmark object
  const bookmark = {
    id: '123',
    title: 'GitHub Shortlink',
    url: 'https://bit.ly/github-repo'
  };

  try {
    const result = await resolver.processBookmark(bookmark);
    
    console.log('Bookmark processed:');
    console.log(`  Title: ${result.title}`);
    console.log(`  Original URL: ${result.originalUrl}`);
    console.log(`  Final URL: ${result.finalUrl}`);
    console.log(`  Redirect Chain: ${result.chain.join(' → ')}`);
    console.log(`  Was Updated: ${result.updated}`);
    console.log(`  Success: ${result.success}`);
    
    return result;
  } catch (error) {
    console.error('Error processing bookmark:', error);
  }
}

// Example 2: Process all bookmarks in browser
async function resolveAllBookmarks() {
  console.log('Example 2: Resolve All Bookmarks');
  console.log('=================================\n');

  const resolver = new RedirectResolver();

  try {
    // Get all bookmarks using Chrome API
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = [];
    
    // Extract all bookmarks from tree
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
        node.children.forEach(child => extractBookmarks(child));
      }
    }
    
    extractBookmarks(tree[0]);
    
    console.log(`Found ${bookmarks.length} bookmarks to process\n`);
    
    // Process all bookmarks with progress tracking
    const summary = await resolver.processBookmarks(bookmarks, (progress) => {
      console.log(`Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
    });
    
    console.log('\n=================================');
    console.log('Final Summary:');
    console.log(`  Total: ${summary.total}`);
    console.log(`  Updated: ${summary.updated}`);
    console.log(`  Resolved: ${summary.resolved}`);
    console.log(`  Unchanged: ${summary.unchanged}`);
    console.log(`  Failed: ${summary.failed}`);
    console.log(`  Cache Hits: ${summary.cached}`);
    
    return summary;
  } catch (error) {
    console.error('Error processing bookmarks:', error);
  }
}

// Example 3: Process bookmarks from specific folder
async function resolveBookmarksInFolder(folderId) {
  console.log('Example 3: Resolve Bookmarks in Folder');
  console.log('======================================\n');

  const resolver = new RedirectResolver();

  try {
    // Get folder contents
    const folder = await chrome.bookmarks.getSubTree(folderId);
    const bookmarks = [];
    
    // Extract bookmarks from folder
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
        node.children.forEach(child => extractBookmarks(child));
      }
    }
    
    extractBookmarks(folder[0]);
    
    console.log(`Found ${bookmarks.length} bookmarks in folder\n`);
    
    // Process bookmarks
    const summary = await resolver.processBookmarks(bookmarks);
    
    console.log('Summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error processing folder:', error);
  }
}

// Example 4: Batch URL resolution (without bookmark updates)
async function resolveBatchUrls() {
  console.log('Example 4: Batch URL Resolution');
  console.log('================================\n');

  const resolver = new RedirectResolver();

  const urls = [
    'https://github.com',
    'https://bit.ly/example',
    'https://t.co/shortened',
    'https://goo.gl/maps/location'
  ];

  try {
    const results = await resolver.resolveUrls(urls, (progress) => {
      console.log(`Resolved ${progress.completed}/${progress.total} URLs`);
    });
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.originalUrl}`);
      if (result.success) {
        console.log(`   → ${result.finalUrl}`);
        console.log(`   Chain: ${result.chain.join(' → ')}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error resolving URLs:', error);
  }
}

// Example 5: Check cache and manage cached URLs
async function manageCacheExample() {
  console.log('Example 5: Cache Management');
  console.log('===========================\n');

  const resolver = new RedirectResolver();

  try {
    // Get cache information
    const cacheInfo = await resolver.getCacheInfo();
    console.log('Cache Info:');
    console.log(`  Total entries: ${cacheInfo.totalEntries}`);
    console.log(`  Valid entries: ${cacheInfo.validEntries}`);
    console.log(`  Expired entries: ${cacheInfo.expiredEntries}`);
    console.log(`  Expiry period: ${cacheInfo.expiryDays} days\n`);
    
    // Clean expired entries
    if (cacheInfo.expiredEntries > 0) {
      const removed = await resolver.cleanExpiredCache();
      console.log(`Cleaned ${removed} expired entries\n`);
    }
    
    // Clear entire cache if needed
    // await resolver.clearCache();
    // console.log('Cache cleared\n');
    
    return cacheInfo;
  } catch (error) {
    console.error('Error managing cache:', error);
  }
}

// Example 6: Get statistics from previous runs
async function getStatisticsExample() {
  console.log('Example 6: Get Statistics');
  console.log('=========================\n');

  const resolver = new RedirectResolver();

  try {
    const stats = await resolver.getStats();
    
    if (stats) {
      console.log('Previous Run Statistics:');
      console.log(`  Total processed: ${stats.total}`);
      console.log(`  Updated: ${stats.updated}`);
      console.log(`  Resolved: ${stats.resolved}`);
      console.log(`  Unchanged: ${stats.unchanged}`);
      console.log(`  Failed: ${stats.failed}`);
      console.log(`  Cache hits: ${stats.cached}`);
      console.log(`  Timestamp: ${new Date(stats.timestamp).toLocaleString()}`);
    } else {
      console.log('No previous statistics found');
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting statistics:', error);
  }
}

// Example 7: Custom progress callback with UI updates
async function resolveWithUIUpdates() {
  console.log('Example 7: Resolve with UI Updates');
  console.log('===================================\n');

  const resolver = new RedirectResolver();

  try {
    // Get all bookmarks
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = [];
    
    function extractBookmarks(node) {
      if (node.url) {
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url
        });
      }
      if (node.children) {
        node.children.forEach(child => extractBookmarks(child));
      }
    }
    
    extractBookmarks(tree[0]);
    
    // Process with detailed progress updates
    const summary = await resolver.processBookmarks(bookmarks, (progress) => {
      // Update UI elements (example)
      const percentage = progress.percentage;
      const stats = progress.stats;
      
      console.log(`\nProgress: ${percentage}%`);
      console.log(`  Completed: ${progress.completed}/${progress.total}`);
      console.log(`  Updated so far: ${stats.updated}`);
      console.log(`  Cache hits: ${stats.cached}`);
      
      // In a real implementation, update DOM elements:
      // document.getElementById('progress-bar').style.width = `${percentage}%`;
      // document.getElementById('stats-updated').textContent = stats.updated;
    });
    
    console.log('\nProcessing complete!');
    return summary;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 8: Filter and process specific bookmarks
async function resolveFilteredBookmarks() {
  console.log('Example 8: Resolve Filtered Bookmarks');
  console.log('=====================================\n');

  const resolver = new RedirectResolver();

  try {
    // Get all bookmarks
    const tree = await chrome.bookmarks.getTree();
    const allBookmarks = [];
    
    function extractBookmarks(node) {
      if (node.url) {
        allBookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url
        });
      }
      if (node.children) {
        node.children.forEach(child => extractBookmarks(child));
      }
    }
    
    extractBookmarks(tree[0]);
    
    // Filter bookmarks that likely need resolution
    // (e.g., short URLs, specific domains)
    const bookmarksToResolve = allBookmarks.filter(bookmark => {
      const url = bookmark.url.toLowerCase();
      return (
        url.includes('bit.ly') ||
        url.includes('t.co') ||
        url.includes('goo.gl') ||
        url.includes('tinyurl') ||
        url.includes('ow.ly') ||
        url.length < 50  // Likely short URLs
      );
    });
    
    console.log(`Found ${bookmarksToResolve.length} bookmarks that may need resolution`);
    console.log(`(out of ${allBookmarks.length} total bookmarks)\n`);
    
    if (bookmarksToResolve.length === 0) {
      console.log('No bookmarks found that need resolution');
      return;
    }
    
    // Process filtered bookmarks
    const summary = await resolver.processBookmarks(bookmarksToResolve);
    
    console.log('\nSummary:', summary);
    return summary;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 9: Process bookmarks with error handling
async function resolveWithErrorHandling() {
  console.log('Example 9: Resolve with Error Handling');
  console.log('======================================\n');

  const resolver = new RedirectResolver();

  try {
    // Get bookmarks
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = [];
    
    function extractBookmarks(node) {
      if (node.url) {
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url
        });
      }
      if (node.children) {
        node.children.forEach(child => extractBookmarks(child));
      }
    }
    
    extractBookmarks(tree[0]);
    
    // Process with comprehensive error handling
    const summary = await resolver.processBookmarks(bookmarks);
    
    // Check for issues
    if (summary.failed > 0) {
      console.warn(`⚠️  ${summary.failed} bookmarks failed to resolve`);
      
      // Get detailed results
      const failedBookmarks = summary.results.filter(r => !r.success);
      console.log('\nFailed bookmarks:');
      failedBookmarks.forEach(result => {
        console.log(`  - ${result.title}`);
        console.log(`    URL: ${result.originalUrl}`);
        console.log(`    Error: ${result.error || 'Unknown'}`);
      });
    }
    
    if (summary.updated > 0) {
      console.log(`\n✅ Successfully updated ${summary.updated} bookmarks`);
    }
    
    return summary;
  } catch (error) {
    console.error('Critical error during processing:', error);
    throw error;
  }
}

// Example 10: Integration with background script
// This would typically be in background.js
async function backgroundScriptIntegration() {
  console.log('Example 10: Background Script Integration');
  console.log('=========================================\n');

  // Listen for messages from popup or options page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'resolveBookmarks') {
      const resolver = new RedirectResolver();
      
      // Get all bookmarks
      chrome.bookmarks.getTree(async (tree) => {
        const bookmarks = [];
        
        function extractBookmarks(node) {
          if (node.url) {
            bookmarks.push({
              id: node.id,
              title: node.title,
              url: node.url
            });
          }
          if (node.children) {
            node.children.forEach(child => extractBookmarks(child));
          }
        }
        
        extractBookmarks(tree[0]);
        
        // Process bookmarks
        const summary = await resolver.processBookmarks(bookmarks, (progress) => {
          // Send progress updates to popup
          chrome.runtime.sendMessage({
            action: 'redirectProgress',
            progress: progress
          });
        });
        
        // Send completion message
        sendResponse({ success: true, summary: summary });
      });
      
      return true; // Keep message channel open for async response
    }
  });
}

// Export examples for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resolveSingleBookmark,
    resolveAllBookmarks,
    resolveBookmarksInFolder,
    resolveBatchUrls,
    manageCacheExample,
    getStatisticsExample,
    resolveWithUIUpdates,
    resolveFilteredBookmarks,
    resolveWithErrorHandling,
    backgroundScriptIntegration
  };
}
