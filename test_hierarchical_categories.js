// Test hierarchical category generation and folder creation
// Run this in the service worker console

console.log('🔍 Testing hierarchical category system...');

async function testHierarchicalCategories() {
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

        // Take first 10 bookmarks for testing
        const testBookmarks = bookmarks.slice(0, 10);
        console.log('Testing with bookmarks:', testBookmarks.map(b => ({
            title: b.title,
            url: b.url,
            folder: b.currentFolderName
        })));

        console.log('3. Testing hierarchical category generation...');
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        const result = await aiProcessor.categorizeBookmarks(
            testBookmarks,
            [], // No suggested categories - let AI generate everything
            {}
        );

        console.log('✅ Hierarchical categorization result:');
        console.log('Generated hierarchical categories:', result.categories);
        console.log('Sample categories:', result.categories.slice(0, 10));
        console.log('Categorization results:', result.results);

        // Test folder creation for hierarchical paths
        console.log('4. Testing hierarchical folder creation...');
        const sampleCategories = result.categories.slice(0, 3);

        for (const category of sampleCategories) {
            if (category !== 'Other') {
                console.log(`Testing folder creation for: ${category}`);
                const folderId = await bookmarkService.findOrCreateFolderByPath(category, '1');
                console.log(`✓ Created/found folder hierarchy: ${category} → ${folderId}`);
            }
        }

        console.log('5. Testing bookmark organization...');
        // Test moving one bookmark to a hierarchical folder
        if (result.results.length > 0) {
            const firstResult = result.results[0];
            const bookmark = testBookmarks.find(b => b.id === firstResult.bookmarkId);

            if (bookmark && firstResult.category !== 'Other') {
                console.log(`Testing bookmark move: "${bookmark.title}" → "${firstResult.category}"`);

                const folderId = await bookmarkService.findOrCreateFolderByPath(firstResult.category, '1');
                await bookmarkService.moveBookmark(bookmark.id, folderId);

                console.log(`✅ Successfully moved bookmark to hierarchical folder!`);
            }
        }

        console.log('🎉 Hierarchical category system test completed successfully!');
        console.log(`Generated ${result.categories.length} hierarchical categories`);
        console.log('Category depth analysis:');

        const depthAnalysis = {};
        result.categories.forEach(cat => {
            const depth = cat.split(' > ').length;
            depthAnalysis[depth] = (depthAnalysis[depth] || 0) + 1;
        });

        console.log('Categories by depth level:', depthAnalysis);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testHierarchicalCategories();