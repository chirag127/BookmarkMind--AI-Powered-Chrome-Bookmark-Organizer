/**
 * BookmarkMind Installation Verification Script
 * Run this in the browser console to check if the extension is working
 */

console.log('🔍 BookmarkMind Installation Verification');
console.log('==========================================');

// Check 1: Chrome APIs
console.log('\n1. Checking Chrome Extension APIs...');
if (typeof chrome === 'undefined') {
    console.error('❌ Chrome object not available');
    console.log('💡 This script must run in a Chrome extension context');
} else {
    console.log('✅ Chrome object available');

    if (chrome.bookmarks) {
        console.log('✅ chrome.bookmarks API available');
    } else {
        console.error('❌ chrome.bookmarks API not available');
    }

    if (chrome.runtime) {
        console.log('✅ chrome.runtime API available');
    } else {
        console.error('❌ chrome.runtime API not available');
    }

    if (chrome.storage) {
        console.log('✅ chrome.storage API available');
    } else {
        console.error('❌ chrome.storage API not available');
    }
}

// Check 2: Test bookmark access
console.log('\n2. Testing bookmark access...');
if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    chrome.bookmarks.getTree()
        .then(tree => {
            console.log('✅ Bookmark tree retrieved successfully');

            // Count bookmarks
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

            const stats = {
                total: bookmarks.length,
                bookmarksBar: bookmarks.filter(b => b.parentId === '1').length,
                otherBookmarks: bookmarks.filter(b => b.parentId === '2').length,
                mobileBookmarks: bookmarks.filter(b => b.parentId === '3').length
            };

            console.log('📊 Bookmark Statistics:');
            console.log(`   Total: ${stats.total}`);
            console.log(`   Bookmarks Bar: ${stats.bookmarksBar}`);
            console.log(`   Other Bookmarks: ${stats.otherBookmarks}`);
            console.log(`   Mobile Bookmarks: ${stats.mobileBookmarks}`);
            console.log(`   Uncategorized: ${stats.bookmarksBar + stats.otherBookmarks + stats.mobileBookmarks}`);

            if (stats.total === 0) {
                console.warn('⚠️  No bookmarks found. Add some bookmarks to test the extension.');
            } else if (stats.bookmarksBar + stats.otherBookmarks + stats.mobileBookmarks === 0) {
                console.warn('⚠️  All bookmarks are in subfolders. Move some to main folders to test.');
            } else {
                console.log('✅ Bookmarks detected - extension should work!');
            }
        })
        .catch(error => {
            console.error('❌ Failed to access bookmarks:', error);
        });
} else {
    console.error('❌ Cannot test bookmark access - APIs not available');
}

// Check 3: Extension context
console.log('\n3. Checking extension context...');
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('✅ Running in extension context');
    console.log(`   Extension ID: ${chrome.runtime.id}`);
} else {
    console.error('❌ Not running in extension context');
    console.log('💡 Make sure to run this from the extension popup or background script');
}

// Instructions
console.log('\n📋 Next Steps:');
console.log('1. If all checks pass: Extension should work normally');
console.log('2. If bookmark access fails: Check extension permissions');
console.log('3. If APIs not available: Reload extension in chrome://extensions/');
console.log('4. If no bookmarks found: Add some bookmarks to test');
console.log('\n🔧 To run this script:');
console.log('1. Open BookmarkMind popup');
console.log('2. Right-click → Inspect');
console.log('3. Go to Console tab');
console.log('4. Paste and run this script');