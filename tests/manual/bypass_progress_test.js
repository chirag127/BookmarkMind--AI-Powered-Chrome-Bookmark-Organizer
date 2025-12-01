// Test categorization without progress callbacks
// Run this in the service worker console

console.log('🔍 Testing categorization without progress callbacks...');

async function testWithoutProgress() {
    try {
        // Import scripts if needed
        if (typeof Categorizer === 'undefined') {
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
        }

        console.log('1. Getting settings...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        if (!settings.bookmarkMindSettings?.apiKey) {
            throw new Error('No API key configured');
        }
        console.log('✅ Settings loaded');

        console.log('2. Creating categorizer...');
        const categorizer = new Categorizer();
        await categorizer.initialize(settings.bookmarkMindSettings);
        console.log('✅ Categorizer initialized');

        console.log('3. Starting categorization WITHOUT progress callbacks...');

        // Call categorizeAllBookmarks with null progress callback
        const results = await categorizer.categorizeAllBookmarks(null, false);

        console.log('✅ Categorization completed!', results);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testWithoutProgress();