/**
 * Service Worker Class Loading Test
 * Run this in the service worker console to test class loading
 */

console.log('🔍 Testing Service Worker Class Loading');
console.log('=====================================');

// Test 1: Check global context
console.log('\n1. Checking global context...');
console.log('Context type:', typeof self !== 'undefined' ? 'Service Worker' : 'Unknown');
console.log('Window available:', typeof window !== 'undefined');
console.log('Self available:', typeof self !== 'undefined');

// Test 2: Check if classes are loaded
console.log('\n2. Checking class availability...');
const classes = {
    BookmarkService: typeof BookmarkService !== 'undefined',
    AIProcessor: typeof AIProcessor !== 'undefined',
    Categorizer: typeof Categorizer !== 'undefined',
    FolderManager: typeof FolderManager !== 'undefined'
};

console.log('Classes loaded:', classes);

// Test 3: Try to instantiate classes
console.log('\n3. Testing class instantiation...');
try {
    if (classes.BookmarkService) {
        const bookmarkService = new BookmarkService();
        console.log('✅ BookmarkService instantiated successfully');
    } else {
        console.error('❌ BookmarkService not available');
    }

    if (classes.AIProcessor) {
        const aiProcessor = new AIProcessor();
        console.log('✅ AIProcessor instantiated successfully');
    } else {
        console.error('❌ AIProcessor not available');
    }

    if (classes.Categorizer) {
        const categorizer = new Categorizer();
        console.log('✅ Categorizer instantiated successfully');
    } else {
        console.error('❌ Categorizer not available');
    }

    if (classes.FolderManager) {
        const folderManager = new FolderManager();
        console.log('✅ FolderManager instantiated successfully');
    } else {
        console.error('❌ FolderManager not available');
    }

} catch (error) {
    console.error('❌ Error instantiating classes:', error);
}

// Test 4: Check Chrome APIs
console.log('\n4. Checking Chrome APIs...');
console.log('chrome available:', typeof chrome !== 'undefined');
console.log('chrome.bookmarks available:', typeof chrome?.bookmarks !== 'undefined');
console.log('chrome.runtime available:', typeof chrome?.runtime !== 'undefined');
console.log('chrome.storage available:', typeof chrome?.storage !== 'undefined');

// Instructions
console.log('\n📋 How to run this test:');
console.log('1. Go to chrome://extensions/');
console.log('2. Find BookmarkMind extension');
console.log('3. Click "Inspect views: service worker"');
console.log('4. In the console, paste and run this script');
console.log('\n🔧 If classes are not loaded:');
console.log('1. Check for errors in the service worker console');
console.log('2. Reload the extension');
console.log('3. Check that all .js files are in the scripts/ folder');