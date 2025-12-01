// Simple categorization test without complex progress tracking
// Run this in the service worker console

console.log('🔍 Starting simple categorization test...');

async function simpleCategorization() {
    try {
        // Import scripts if needed
        if (typeof Categorizer === 'undefined') {
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
        }

        // Get settings
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        if (!settings.bookmarkMindSettings?.apiKey) {
            throw new Error('No API key configured');
        }

        // Create instances
        const bookmarkService = new BookmarkService();
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        // Get bookmarks
        console.log('Getting bookmarks...');
        const bookmarks = await bookmarkService.getAllBookmarks();
        console.log(`Found ${bookmarks.length} total bookmarks`);

        // Filter uncategorized (just first 5 for testing)
        const uncategorized = bookmarks
            .filter(b => ['1', '2', '3'].includes(b.parentId))
            .slice(0, 5); // Just test with 5 bookmarks

        console.log(`Testing with ${uncategorized.length} bookmarks:`, uncategorized.map(b => b.title));

        if (uncategorized.length === 0) {
            console.log('No uncategorized bookmarks found');
            return;
        }

        // Test AI categorization
        console.log('Starting AI categorization...');
        const categories = settings.bookmarkMindSettings.categories || ['Work', 'Personal', 'Shopping', 'Entertainment', 'Other'];

        const results = await aiProcessor.categorizeBookmarks(uncategorized, categories, {});
        console.log('AI results:', results);

        // Test moving one bookmark
        if (results.length > 0) {
            const firstResult = results[0];
            const bookmark = uncategorized.find(b => b.id === firstResult.bookmarkId);

            if (bookmark && firstResult.category !== 'Other') {
                console.log(`Testing folder creation and move for: ${bookmark.title} -> ${firstResult.category}`);

                // Find or create folder
                const folderId = await bookmarkService.findOrCreateFolderByPath(firstResult.category, '1');
                console.log(`Created/found folder: ${folderId}`);

                // Move bookmark
                await bookmarkService.moveBookmark(bookmark.id, folderId);
                console.log(`✅ Successfully moved bookmark to ${firstResult.category}`);
            }
        }

        console.log('🎉 Simple categorization test completed successfully!');

    } catch (error) {
        console.error('❌ Simple categorization failed:', error);
        console.error('Error stack:', error.stack);
    }
}

// Run the test
simpleCategorization();