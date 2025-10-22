// Debug script to check folder protection and prevent emptying
// Run this in the service worker console

console.log('🔍 Debugging folder protection...');

async function debugFolderProtection() {
    try {
        console.log('1. Checking current folder structure...');

        // Get current bookmark tree
        const tree = await chrome.bookmarks.getTree();

        function countFoldersAndBookmarks(node, path = '') {
            const currentPath = path ? `${path}/${node.title}` : node.title;
            let folderCount = 0;
            let bookmarkCount = 0;

            if (node.url) {
                // This is a bookmark
                bookmarkCount = 1;
            } else {
                // This is a folder
                folderCount = 1;
                console.log(`📁 Folder: ${currentPath} (ID: ${node.id})`);

                if (node.children) {
                    let childBookmarks = 0;
                    let childFolders = 0;

                    node.children.forEach(child => {
                        const counts = countFoldersAndBookmarks(child, currentPath);
                        childFolders += counts.folders;
                        childBookmarks += counts.bookmarks;
                    });

                    console.log(`   └─ Contains: ${childBookmarks} bookmarks, ${childFolders} subfolders`);

                    if (childBookmarks === 0 && childFolders === 0 && node.id !== '1' && node.id !== '2' && node.id !== '3') {
                        console.log(`   ⚠️  EMPTY FOLDER DETECTED: ${currentPath}`);
                    }

                    folderCount += childFolders;
                    bookmarkCount += childBookmarks;
                }
            }

            return { folders: folderCount, bookmarks: bookmarkCount };
        }

        const rootCounts = countFoldersAndBookmarks(tree[0]);
        console.log(`\nTotal: ${rootCounts.folders} folders, ${rootCounts.bookmarks} bookmarks`);

        console.log('\n2. Checking extension settings...');
        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);
        console.log('Cleanup setting:', settings.bookmarkMindSettings?.cleanupEmptyFolders);

        console.log('\n3. Testing folder protection...');

        // Check if FolderManager exists and has cleanup function
        if (typeof FolderManager !== 'undefined') {
            console.log('✓ FolderManager class available');

            const folderManager = new FolderManager();

            // Check if cleanup function exists
            if (typeof folderManager.cleanupEmptyFolders === 'function') {
                console.log('⚠️  cleanupEmptyFolders function exists');
                console.log('   This function can remove empty folders');
                console.log('   Make sure cleanupEmptyFolders setting is disabled!');
            }
        } else {
            console.log('❌ FolderManager class not available');
        }

        console.log('\n4. Recommendations:');
        console.log('✅ Set cleanupEmptyFolders to false in settings');
        console.log('✅ Never call folderManager.cleanupEmptyFolders() during categorization');
        console.log('✅ Only move bookmarks TO folders, never FROM folders');
        console.log('✅ Preserve existing folder structures');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run the debug
debugFolderProtection();