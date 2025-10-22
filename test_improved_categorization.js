// Test the improved categorization with better timeout handling
// Run this in the service worker console

console.log('🔍 Testing improved hierarchical categorization...');

async function testImprovedCategorization() {
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

        console.log('2. Creating categorizer...');
        const categorizer = new Categorizer();
        await categorizer.initialize(settings.bookmarkMindSettings);

        console.log('3. Getting bookmarks (limited to 10 for testing)...');
        const bookmarkService = new BookmarkService();
        const allBookmarks = await bookmarkService.getAllBookmarks();

        // Filter uncategorized and limit for testing
        const uncategorized = allBookmarks
            .filter(b => ['1', '2', '3'].includes(b.parentId))
            .slice(0, 10); // Test with just 10 bookmarks

        console.log(`Testing with ${uncategorized.length} bookmarks`);
        console.log('Sample bookmarks:', uncategorized.map(b => ({
            title: b.title,
            url: b.url?.substring(0, 50) + '...',
            currentFolder: b.currentFolderName
        })));

        console.log('4. Starting improved categorization...');

        // Test the categorization process with progress tracking
        const results = await categorizer.categorizeAllBookmarks((progress) => {
            console.log(`📊 Progress: ${progress.stage} - ${progress.progress}%`);
        }, false);

        console.log('✅ Improved categorization completed!');
        console.log('Results summary:', {
            processed: results.processed,
            categorized: results.categorized,
            errors: results.errors,
            totalCategories: results.generatedCategories?.length || 0
        });

        if (results.generatedCategories) {
            console.log('\n📁 Generated Categories (first 10):');
            results.generatedCategories.slice(0, 10).forEach((cat, i) => {
                console.log(`${i + 1}. ${cat}`);
            });

            console.log(`\n... and ${results.generatedCategories.length - 10} more categories`);

            // Show category depth analysis
            const depthAnalysis = {};
            results.generatedCategories.forEach(cat => {
                if (cat !== 'Other') {
                    const depth = cat.split(' > ').length;
                    depthAnalysis[depth] = (depthAnalysis[depth] || 0) + 1;
                }
            });

            console.log('\n📊 Category Depth Analysis:', depthAnalysis);
        }

        console.log('\n🎉 Improved categorization test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testImprovedCategorization();