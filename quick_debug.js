// Quick Debug Script - Run this in the service worker console
// Go to chrome://extensions/ → BookmarkMind → "Inspect views: service worker"

console.log('🔍 Quick BookmarkMind Debug');
console.log('==========================');

// Step 1: Check if classes are loaded
console.log('\n1. Class Availability:');
console.log('BookmarkService:', typeof BookmarkService !== 'undefined' ? '✅' : '❌');
console.log('AIProcessor:', typeof AIProcessor !== 'undefined' ? '✅' : '❌');
console.log('Categorizer:', typeof Categorizer !== 'undefined' ? '✅' : '❌');
console.log('FolderManager:', typeof FolderManager !== 'undefined' ? '✅' : '❌');

// Step 2: Check Chrome APIs
console.log('\n2. Chrome APIs:');
console.log('chrome.bookmarks:', typeof chrome?.bookmarks !== 'undefined' ? '✅' : '❌');
console.log('chrome.storage:', typeof chrome?.storage !== 'undefined' ? '✅' : '❌');
console.log('chrome.runtime:', typeof chrome?.runtime !== 'undefined' ? '✅' : '❌');

// Step 3: Test settings
console.log('\n3. Testing Settings...');
chrome.storage.sync.get(['bookmarkMindSettings']).then(result => {
    console.log('Settings found:', !!result.bookmarkMindSettings ? '✅' : '❌');
    if (result.bookmarkMindSettings) {
        console.log('API Key configured:', !!result.bookmarkMindSettings.apiKey ? '✅' : '❌');
        console.log('Categories count:', result.bookmarkMindSettings.categories?.length || 0);
    } else {
        console.log('❌ No settings found - extension not configured');
    }
}).catch(error => {
    console.error('❌ Settings error:', error);
});

// Step 4: Test bookmark access
console.log('\n4. Testing Bookmarks...');
chrome.bookmarks.getTree().then(tree => {
    console.log('Bookmark tree loaded:', tree.length > 0 ? '✅' : '❌');

    // Count bookmarks
    let count = 0;
    function countBookmarks(node) {
        if (node.url) count++;
        if (node.children) node.children.forEach(countBookmarks);
    }
    countBookmarks(tree[0]);

    console.log('Total bookmarks found:', count);
    if (count === 0) {
        console.log('⚠️ No bookmarks found - add some bookmarks to test');
    }
}).catch(error => {
    console.error('❌ Bookmark access error:', error);
});

console.log('\n📋 Instructions:');
console.log('1. Copy this entire script');
console.log('2. Go to chrome://extensions/');
console.log('3. Find BookmarkMind → Click "Inspect views: service worker"');
console.log('4. Paste and run this script in the console');
console.log('5. Check which items show ❌ and fix those first');