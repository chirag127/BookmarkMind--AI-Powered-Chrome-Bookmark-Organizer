// Test hierarchical folder creation with the generated categories
// Run this in the service worker console

console.log('🔍 Testing hierarchical folder creation...');

async function testHierarchicalFolderCreation() {
    try {
        // Import scripts if needed
        if (typeof BookmarkService === 'undefined') {
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
        }

        console.log('1. Creating BookmarkService...');
        const bookmarkService = new BookmarkService();

        // Test categories from your log
        const testCategories = [
            'AI > Generative AI > Chatbots > Benchmarking > LMSYS Arena',
            'AI > Large Language Models (LLM) > Models > Meta > Llama 3.1 GitHub',
            'Development > Online IDEs > Replit > Web Projects > Twitter Clone',
            'Learning > Competitive Programming > Platforms > Contest Aggregator > CLIST',
            'Marketing > SEO > Research > Google Search Operators > Moz Guide'
        ];

        console.log('2. Testing folder creation for sample categories...');

        for (const category of testCategories) {
            console.log(`\n📁 Creating folder hierarchy: ${category}`);

            try {
                const folderId = await bookmarkService.findOrCreateFolderByPath(category, '1');
                console.log(`✅ Successfully created hierarchy: ${category} → ${folderId}`);
            } catch (error) {
                console.error(`❌ Failed to create hierarchy: ${category}`, error);
            }
        }

        console.log('\n3. Verifying folder structure...');

        // Get the bookmarks tree to verify structure
        const tree = await chrome.bookmarks.getTree();

        function findFoldersByName(node, name, results = []) {
            if (!node.url && node.title === name) {
                results.push(node);
            }
            if (node.children) {
                node.children.forEach(child => findFoldersByName(child, name, results));
            }
            return results;
        }

        // Check if AI folder was created
        const aiFolders = findFoldersByName(tree[0], 'AI');
        console.log(`Found ${aiFolders.length} AI folders`);

        if (aiFolders.length > 0) {
            console.log('AI folder structure:');
            function printStructure(node, indent = '') {
                console.log(`${indent}📁 ${node.title}`);
                if (node.children) {
                    node.children.forEach(child => {
                        if (!child.url) { // Only folders
                            printStructure(child, indent + '  ');
                        }
                    });
                }
            }
            printStructure(aiFolders[0]);
        }

        console.log('\n🎉 Hierarchical folder creation test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testHierarchicalFolderCreation();