// Test if the extension is working after fixing the const assignment error
// Run this in the service worker console

console.log('🔍 Testing extension after const assignment fix...');

async function testExtensionFix() {
    try {
        console.log('1. Testing script imports...');

        // Try to import scripts
        try {
            importScripts('bookmarkService.js', 'aiProcessor.js', 'categorizer.js', 'folderManager.js');
            console.log('✅ Scripts imported successfully');
        } catch (importError) {
            console.error('❌ Script import failed:', importError);
            return;
        }

        console.log('2. Testing class availability...');
        console.log('Classes available:', {
            BookmarkService: typeof BookmarkService !== 'undefined',
            AIProcessor: typeof AIProcessor !== 'undefined',
            Categorizer: typeof Categorizer !== 'undefined',
            FolderManager: typeof FolderManager !== 'undefined'
        });

        console.log('3. Testing basic functionality...');

        // Test BookmarkService
        const bookmarkService = new BookmarkService();
        console.log('✅ BookmarkService created');

        // Test AIProcessor
        const aiProcessor = new AIProcessor();
        console.log('✅ AIProcessor created');

        // Test Categorizer
        const categorizer = new Categorizer();
        console.log('✅ Categorizer created');

        console.log('4. Testing Chrome APIs...');
        if (chrome.bookmarks) {
            console.log('✅ Chrome bookmarks API available');
        } else {
            console.error('❌ Chrome bookmarks API not available');
        }

        if (chrome.storage) {
            console.log('✅ Chrome storage API available');
        } else {
            console.error('❌ Chrome storage API not available');
        }

        console.log('5. Testing message handling...');

        // Test ping message
        try {
            const pingResponse = await chrome.runtime.sendMessage({ action: 'ping' });
            if (pingResponse && pingResponse.success) {
                console.log('✅ Message handling working');
            } else {
                console.error('❌ Message handling failed:', pingResponse);
            }
        } catch (messageError) {
            console.error('❌ Message test failed:', messageError);
        }

        console.log('🎉 Extension fix test completed!');
        console.log('The extension should now be working properly.');

    } catch (error) {
        console.error('❌ Extension fix test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testExtensionFix();