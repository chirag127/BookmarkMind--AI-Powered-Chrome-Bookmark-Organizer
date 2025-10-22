// Complete test of the hierarchical bookmark categorization system
// Run this in the service worker console

console.log('🔍 Testing complete hierarchical bookmark system...');

async function testFullHierarchicalSystem() {
    try {
        // Import scripts if needed
        if (typeof Categorizer === 'undefined') {
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
        }

        console.log('1. Checking settings...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        if (!settings.bookmarkMindSettings?.apiKey) {
            throw new Error('No API key configured');
        }

        console.log('Settings:', {
            hierarchicalMode: settings.bookmarkMindSettings.hierarchicalMode,
            maxCategoryDepth: settings.bookmarkMindSettings.maxCategoryDepth,
            minCategories: settings.bookmarkMindSettings.minCategories,
            maxCategories: settings.bookmarkMindSettings.maxCategories
        });

        console.log('2. Creating categorizer...');
        const categorizer = new Categorizer();
        await categorizer.initialize(settings.bookmarkMindSettings);

        console.log('3. Starting hierarchical categorization (limited to 20 bookmarks for testing)...');

        // Get bookmarks and limit for testing
        const bookmarkService = new BookmarkService();
        const allBookmarks = await bookmarkService.getAllBookmarks();
        console.log(`Found ${allBookmarks.length} total bookmarks`);

        // Filter uncategorized and limit for testing
        const uncategorized = allBookmarks
            .filter(b => ['1', '2', '3'].includes(b.parentId))
            .slice(0, 20); // Test with 20 bookmarks

        console.log(`Testing with ${uncategorized.length} bookmarks`);
        console.log('Sample bookmarks:', uncategorized.slice(0, 5).map(b => ({
            title: b.title,
            url: b.url,
            currentFolder: b.currentFolderName
        })));

        // Test the full categorization process
        const results = await categorizer.categorizeAllBookmarks((progress) => {
            console.log(`Progress: ${progress.stage} - ${progress.progress}%`);
        }, false);

        console.log('✅ Hierarchical categorization completed!');
        console.log('Results:', results);

        if (results.generatedCategories) {
            console.log('\n📁 Generated Hierarchical Categories:');
            results.generatedCategories.forEach((category, index) => {
                const depth = category.split(' > ').length;
                const indent = '  '.repeat(depth - 1);
                console.log(`${index + 1}. ${indent}${category} (depth: ${depth})`);
            });

            // Analyze category structure
            console.log('\n📊 Category Analysis:');
            const depthAnalysis = {};
            const topLevelCategories = new Set();

            results.generatedCategories.forEach(cat => {
                if (cat !== 'Other') {
                    const parts = cat.split(' > ');
                    const depth = parts.length;
                    depthAnalysis[depth] = (depthAnalysis[depth] || 0) + 1;
                    topLevelCategories.add(parts[0]);
                }
            });

            console.log('Categories by depth:', depthAnalysis);
            console.log('Top-level categories:', Array.from(topLevelCategories));
            console.log(`Total hierarchical categories: ${results.generatedCategories.length - 1} (excluding Other)`);

            // Show folder structure that was created
            console.log('\n🗂️ Created Folder Structure:');
            const uniquePaths = new Set();
            results.generatedCategories.forEach(cat => {
                if (cat !== 'Other') {
                    const parts = cat.split(' > ');
                    for (let i = 1; i <= parts.length; i++) {
                        uniquePaths.add(parts.slice(0, i).join(' > '));
                    }
                }
            });

            const sortedPaths = Array.from(uniquePaths).sort();
            sortedPaths.forEach(path => {
                const depth = path.split(' > ').length;
                const indent = '  '.repeat(depth - 1);
                console.log(`${indent}📁 ${path.split(' > ').pop()}`);
            });
        }

        console.log('\n🎉 Full hierarchical system test completed successfully!');
        console.log(`Processed: ${results.processed} bookmarks`);
        console.log(`Categorized: ${results.categorized} bookmarks`);
        console.log(`Errors: ${results.errors} bookmarks`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the comprehensive test
testFullHierarchicalSystem();