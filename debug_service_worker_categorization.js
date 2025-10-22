/**
 * Service Worker Categorization Debug Script
 * Run this in the service worker console to debug categorization issues
 */

console.log('🔍 BookmarkMind Categorization Debug');
console.log('===================================');

async function debugCategorization() {
    try {
        console.log('\n1. Checking class availability...');
        const classes = {
            BookmarkService: typeof BookmarkService !== 'undefined',
            AIProcessor: typeof AIProcessor !== 'undefined',
            Categorizer: typeof Categorizer !== 'undefined',
            FolderManager: typeof FolderManager !== 'undefined'
        };
        console.log('Classes:', classes);

        if (!classes.Categorizer) {
            console.error('❌ Categorizer class not available');
            return;
        }

        console.log('\n2. Testing class instantiation...');
        const categorizer = new Categorizer();
        console.log('✅ Categorizer instance created');

        console.log('\n3. Checking Chrome APIs...');
        if (!chrome.bookmarks) {
            console.error('❌ chrome.bookmarks not available');
            return;
        }
        if (!chrome.storage) {
            console.error('❌ chrome.storage not available');
            return;
        }
        console.log('✅ Chrome APIs available');

        console.log('\n4. Testing bookmark access...');
        const tree = await chrome.bookmarks.getTree();
        console.log(`✅ Bookmark tree loaded, ${tree.length} root nodes`);

        console.log('\n5. Testing settings access...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        console.log('Settings:', settings);

        if (!settings.bookmarkMindSettings) {
            console.error('❌ No settings found');
            return;
        }

        if (!settings.bookmarkMindSettings.apiKey) {
            console.error('❌ No API key configured');
            return;
        }
        console.log('✅ Settings and API key found');

        console.log('\n6. Testing bookmark service...');
        const bookmarkService = new BookmarkService();
        const bookmarks = await bookmarkService.getAllBookmarks();
        console.log(`✅ Found ${bookmarks.length} bookmarks`);

        if (bookmarks.length === 0) {
            console.warn('⚠️ No bookmarks found - add some bookmarks to test');
            return;
        }

        console.log('\n7. Testing categorizer initialization...');
        await categorizer.initialize(settings.bookmarkMindSettings);
        console.log('✅ Categorizer initialized');

        console.log('\n8. Testing AI processor...');
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        // Test with a small sample
        const testBookmarks = bookmarks.slice(0, 2);
        console.log(`Testing with ${testBookmarks.length} sample bookmarks...`);

        const testCategories = ['Work', 'Personal', 'Other'];
        const results = await aiProcessor.categorizeBookmarks(testBookmarks, testCategories, {});
        console.log('✅ AI categorization test successful:', results);

        console.log('\n🎉 All tests passed! Categorization should work.');

    } catch (error) {
        console.error('❌ Debug test failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Provide specific guidance based on error
        if (error.message.includes('API key')) {
            console.log('💡 Fix: Configure your Gemini API key in extension settings');
        } else if (error.message.includes('bookmarks')) {
            console.log('💡 Fix: Check bookmark permissions in chrome://extensions/');
        } else if (error.message.includes('not defined')) {
            console.log('💡 Fix: Reload the extension to load all classes');
        } else {
            console.log('💡 Fix: Check the full error details above');
        }
    }
}

// Auto-run the debug test
debugCategorization();

console.log('\n📋 How to use this script:');
console.log('1. Go to chrome://extensions/');
console.log('2. Find BookmarkMind extension');
console.log('3. Click "Inspect views: service worker"');
console.log('4. Paste and run this script in the console');
console.log('5. Check the output for any errors or issues');