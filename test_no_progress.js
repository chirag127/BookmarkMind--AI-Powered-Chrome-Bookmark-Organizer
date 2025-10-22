// Test categorization with no progress callback
// Run this in the service worker console

console.log('🔍 Testing categorization with no progress callback...');

async function testNoProgressCallback() {
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

        console.log('2. Creating and initializing categorizer...');
        const categorizer = new Categorizer();
        await categorizer.initialize(settings.bookmarkMindSettings);

        console.log('3. Starting categorization with NO progress callback...');

        // Call with a simple console.log progress callback instead of messaging
        const results = await categorizer.categorizeAllBookmarks((progress) => {
            console.log('Simple progress:', progress);
        }, false);

        console.log('✅ Categorization completed successfully!', results);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testNoProgressCallback();