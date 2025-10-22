// Test Small Batch Categorization - Run this in service worker console
// Go to chrome://extensions/ → BookmarkMind → "Inspect views: service worker"

console.log('🔍 Testing Small Batch Categorization');
console.log('====================================');

async function testSmallBatch() {
    try {
        console.log('\n1. Checking classes...');
        if (typeof Categorizer === 'undefined') {
            console.error('❌ Categorizer not available');
            return;
        }

        console.log('\n2. Getting settings...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        if (!settings.bookmarkMindSettings?.apiKey) {
            console.error('❌ No API key configured');
            return;
        }

        console.log('\n3. Getting bookmarks...');
        const bookmarkService = new BookmarkService();
        const allBookmarks = await bookmarkService.getAllBookmarks();
        console.log(`Found ${allBookmarks.length} total bookmarks`);

        if (allBookmarks.length === 0) {
            console.error('❌ No bookmarks found');
            return;
        }

        console.log('\n4. Testing with first 5 bookmarks...');
        const testBookmarks = allBookmarks.slice(0, 5);
        console.log('Test bookmarks:', testBookmarks.map(b => ({ title: b.title, url: b.url })));

        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        console.log('\n5. Calling AI categorization...');
        const results = await aiProcessor.categorizeBookmarks(
            testBookmarks,
            settings.bookmarkMindSettings.categories || ['Work', 'Personal', 'Other'],
            {}
        );

        console.log('✅ AI categorization successful!');
        console.log('Results:', results);

        console.log('\n6. Testing full categorization with small set...');
        const categorizer = new Categorizer();
        await categorizer.initialize(settings.bookmarkMindSettings);

        // Mock progress callback
        const progressCallback = (progress) => {
            console.log('Progress:', progress);
        };

        // Test with force reorganize to get some bookmarks
        const fullResults = await categorizer.categorizeAllBookmarks(progressCallback, true);
        console.log('✅ Full categorization test successful!');
        console.log('Full results:', fullResults);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });

        if (error.message.includes('timeout')) {
            console.log('💡 The process is timing out - try reducing batch size');
        } else if (error.message.includes('API')) {
            console.log('💡 API issue - check your API key and network connection');
        } else {
            console.log('💡 Check the error details above for specific issue');
        }
    }
}

// Run the test
testSmallBatch();

console.log('\n📋 Instructions:');
console.log('1. Go to chrome://extensions/');
console.log('2. Find BookmarkMind → Click "Inspect views: service worker"');
console.log('3. Paste and run this script');
console.log('4. This will test with just 5 bookmarks first');