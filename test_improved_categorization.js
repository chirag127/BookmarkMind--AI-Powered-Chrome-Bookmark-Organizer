// Test the improved categorization with smart fallback
// Run this in the service worker console

console.log('🔍 Testing improved categorization with smart fallback...');

async function testImprovedCategorization() {
    try {
        // Force reload scripts
        importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');

        console.log('1. Getting settings and bookmarks...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        if (!settings.bookmarkMindSettings?.apiKey) {
            throw new Error('No API key configured');
        }

        const bookmarkService = new BookmarkService();
        const allBookmarks = await bookmarkService.getAllBookmarks();

        // Get 5 bookmarks for testing
        const testBookmarks = allBookmarks.filter(b => ['1', '2', '3'].includes(b.parentId)).slice(0, 5);

        if (testBookmarks.length === 0) {
            console.log('❌ No uncategorized bookmarks found');
            return;
        }

        console.log(`Testing with ${testBookmarks.length} bookmarks:`);
        testBookmarks.forEach((b, i) => {
            console.log(`${i + 1}. "${b.title}" (${b.url?.substring(0, 50)}...)`);
        });

        console.log('2. Running AI categorization...');
        const aiProcessor = new AIProcessor();
        aiProcessor.setApiKey(settings.bookmarkMindSettings.apiKey);

        const result = await aiProcessor.categorizeBookmarks(testBookmarks, [], {});

        console.log('AI categorization results:');
        console.log(`- Generated categories: ${result.categories?.length || 0}`);
        console.log(`- Bookmark results: ${result.results?.length || 0}`);

        if (result.categories && result.categories.length > 0) {
            console.log('\nGenerated categories (first 10):');
            result.categories.slice(0, 10).forEach((cat, i) => {
                console.log(`${i + 1}. ${cat}`);
            });
        }

        if (result.results && result.results.length > 0) {
            console.log('\nBookmark categorizations:');
            result.results.forEach((res, i) => {
                const bookmark = testBookmarks.find(b => b.id === res.bookmarkId);
                console.log(`${i + 1}. "${bookmark?.title}" → "${res.category}" (confidence: ${res.confidence})`);
            });

            // Check how many are "Other"
            const otherCount = result.results.filter(r => r.category === 'Other').length;
            const specificCount = result.results.length - otherCount;

            console.log(`\nCategory distribution: ${specificCount} specific, ${otherCount} "Other"`);

            if (specificCount > 0) {
                console.log('✅ Good! Some bookmarks got specific categories');

                console.log('3. Testing folder creation for assigned categories...');

                // Test creating folders for the assigned categories
                const categoriesToCreate = [...new Set(result.results.map(r => r.category))];

                for (const category of categoriesToCreate) {
                    console.log(`\nCreating folder: ${category}`);
                    try {
                        const folderId = await bookmarkService.findOrCreateFolderByPath(category, '1');
                        console.log(`✅ Folder created: ${category} → ${folderId}`);
                    } catch (error) {
                        console.error(`❌ Failed to create folder: ${category}`, error);
                    }
                }

                console.log('4. Testing bookmark moves...');

                // Test moving bookmarks to their assigned folders
                for (const res of result.results) {
                    const bookmark = testBookmarks.find(b => b.id === res.bookmarkId);
                    if (!bookmark) continue;

                    console.log(`\nMoving: "${bookmark.title}" → "${res.category}"`);
                    try {
                        const folderId = await bookmarkService.findOrCreateFolderByPath(res.category, '1');
                        await bookmarkService.moveBookmark(bookmark.id, folderId);
                        console.log(`✅ Moved successfully!`);
                    } catch (error) {
                        console.error(`❌ Failed to move bookmark:`, error);
                    }
                }

            } else {
                console.log('⚠️  All bookmarks categorized as "Other" - this suggests AI processing issues');
            }
        }

        console.log('5. Checking final folder structure...');

        const bookmarksBar = await chrome.bookmarks.getChildren('1');
        const folders = bookmarksBar.filter(item => !item.url);

        console.log(`\nBookmarks Bar now has ${folders.length} folders:`);
        folders.forEach(folder => {
            console.log(`📁 ${folder.title}`);
        });

        // Look for hierarchical folders
        const hierarchicalFolders = ['AI', 'Development', 'Learning', 'Shopping', 'Tools', 'Business'];
        const foundFolders = [];

        for (const folderName of hierarchicalFolders) {
            const folder = folders.find(f => f.title === folderName);
            if (folder) {
                foundFolders.push(folderName);
                console.log(`✅ Found hierarchical folder: ${folderName}`);
            }
        }

        if (foundFolders.length > 0) {
            console.log(`\n🎉 SUCCESS! Created ${foundFolders.length} hierarchical folders!`);
            console.log(`Folders: ${foundFolders.join(', ')}`);
        } else {
            console.log('\n❌ No hierarchical folders found - categorization may have failed');
        }

        console.log('\n🎯 Improved categorization test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testImprovedCategorization();