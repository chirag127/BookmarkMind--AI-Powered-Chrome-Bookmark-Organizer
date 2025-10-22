// Test if the timeout fix is working
// Run this in the service worker console

console.log('🔍 Testing timeout fix...');

async function testTimeoutFix() {
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

        console.log('2. Creating AI processor...');
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        console.log('3. Getting a few bookmarks for testing...');
        const bookmarkService = new BookmarkService();
        const bookmarks = await bookmarkService.getAllBookmarks();

        // Take just 3 bookmarks for testing
        const testBookmarks = bookmarks.filter(b => ['1', '2', '3'].includes(b.parentId)).slice(0, 3);

        if (testBookmarks.length === 0) {
            console.log('No uncategorized bookmarks found for testing');
            return;
        }

        console.log(`Testing with ${testBookmarks.length} bookmarks:`, testBookmarks.map(b => b.title));

        console.log('4. Testing AI categorization with new timeout...');
        console.log('⏱️ Starting timer to measure actual timeout...');

        const startTime = Date.now();

        try {
            const result = await aiProcessor.categorizeBookmarks(testBookmarks, [], {});

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            console.log(`✅ Categorization completed in ${duration} seconds`);
            console.log('Generated categories:', result.categories?.length || 0);
            console.log('Results:', result.results?.length || 0);

            if (result.categories) {
                console.log('Sample categories:', result.categories.slice(0, 5));
            }

        } catch (error) {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            console.log(`❌ Categorization failed after ${duration} seconds`);
            console.log('Error:', error.message);

            if (error.message.includes('timeout')) {
                if (duration < 60) {
                    console.log('🚨 TIMEOUT TOO SHORT! The timeout is still not working properly.');
                    console.log('Expected: 10 minutes (600 seconds)');
                    console.log(`Actual: ~${duration} seconds`);
                } else {
                    console.log('✅ Timeout is working correctly (took longer than 1 minute)');
                }
            }
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error);
    }
}

// Run the test
testTimeoutFix();