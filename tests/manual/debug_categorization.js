// Debug script to test categorization flow step by step
// Run this in the service worker console

console.log('🔍 Starting categorization debug...');

async function debugCategorization() {
    try {
        console.log('1. Testing Chrome APIs...');

        // Test 1: Chrome APIs
        if (!chrome.bookmarks) {
            throw new Error('Chrome bookmarks API not available');
        }
        if (!chrome.storage) {
            throw new Error('Chrome storage API not available');
        }
        console.log('✅ Chrome APIs available');

        // Test 2: Check if classes are loaded
        console.log('2. Checking classes...');
        console.log('Classes available:', {
            BookmarkService: typeof BookmarkService !== 'undefined',
            AIProcessor: typeof AIProcessor !== 'undefined',
            Categorizer: typeof Categorizer !== 'undefined',
            FolderManager: typeof FolderManager !== 'undefined'
        });

        if (typeof Categorizer === 'undefined') {
            console.log('❌ Categorizer class not loaded, trying to import...');
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
            console.log('✅ Scripts imported');
        }

        // Test 3: Get settings
        console.log('3. Getting settings...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        console.log('Settings:', settings);

        if (!settings.bookmarkMindSettings?.apiKey) {
            throw new Error('No API key configured');
        }
        console.log('✅ API key found');

        // Test 4: Create categorizer
        console.log('4. Creating categorizer...');
        const categorizer = new Categorizer();
        console.log('✅ Categorizer created');

        // Test 5: Initialize categorizer
        console.log('5. Initializing categorizer...');
        await categorizer.initialize(settings.bookmarkMindSettings);
        console.log('✅ Categorizer initialized');

        // Test 6: Get bookmarks
        console.log('6. Getting bookmarks...');
        const bookmarkService = new BookmarkService();
        const bookmarks = await bookmarkService.getAllBookmarks();
        console.log(`✅ Got ${bookmarks.length} bookmarks`);

        if (bookmarks.length === 0) {
            console.log('⚠️ No bookmarks found');
            return;
        }

        // Test 7: Filter uncategorized
        const uncategorized = bookmarks.filter(bookmark => {
            const isInMainFolders = ['1', '2', '3'].includes(bookmark.parentId);
            const isInRootLevel = bookmark.currentFolderName &&
                ['Bookmarks Bar', 'Other Bookmarks', 'Mobile Bookmarks'].includes(bookmark.currentFolderName);
            return isInMainFolders || isInRootLevel;
        });

        console.log(`✅ Found ${uncategorized.length} uncategorized bookmarks`);

        if (uncategorized.length === 0) {
            console.log('⚠️ No uncategorized bookmarks');
            return;
        }

        // Test 8: Test AI processor with just 1 bookmark
        console.log('7. Testing AI processor with 1 bookmark...');
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        const testBookmark = uncategorized[0];
        console.log('Test bookmark:', testBookmark);

        const testResult = await aiProcessor.categorizeBookmarks(
            [testBookmark],
            settings.bookmarkMindSettings.categories || ['Work', 'Personal', 'Other'],
            {}
        );

        console.log('✅ AI categorization test result:', testResult);

        console.log('🎉 All tests passed! Categorization should work.');

    } catch (error) {
        console.error('❌ Debug failed at step:', error.message);
        console.error('Full error:', error);
    }
}

// Run the debug
debugCategorization();