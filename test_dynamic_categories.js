// Test dynamic category generation
// Run this in the service worker console

console.log('🔍 Testing dynamic category generation...');

async function testDynamicCategories() {
    try {
        // Import scripts if needed
        if (typeof AIProcessor === 'undefined') {
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
        }

        console.log('1. Getting settings...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        if (!settings.bookmarkMindSettings?.apiKey) {
            throw new Error('No API key configured');
        }

        console.log('2. Getting bookmarks...');
        const bookmarkService = new BookmarkService();
        const bookmarks = await bookmarkService.getAllBookmarks();
        console.log(`Found ${bookmarks.length} bookmarks`);

        if (bookmarks.length === 0) {
            console.log('No bookmarks to analyze');
            return;
        }

        // Take first 20 bookmarks for testing
        const testBookmarks = bookmarks.slice(0, 20);
        console.log('Testing with bookmarks:', testBookmarks.map(b => ({ title: b.title, url: b.url, folder: b.currentFolderName })));

        console.log('3. Testing AI processor with dynamic categories...');
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        const result = await aiProcessor.categorizeBookmarks(
            testBookmarks,
            ['Work', 'Personal', 'Shopping', 'Entertainment'], // Suggested categories
            {}
        );

        console.log('✅ Dynamic categorization result:');
        console.log('Generated categories:', result.categories);
        console.log('Categorization results:', result.results);
        console.log('Sample categorizations:', result.results.slice(0, 5));

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testDynamicCategories();