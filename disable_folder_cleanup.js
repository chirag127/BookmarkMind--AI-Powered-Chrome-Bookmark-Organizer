// Disable folder cleanup to prevent emptying folders
// Run this in the service worker console

console.log('🛡️  Disabling folder cleanup to protect existing folders...');

async function disableFolderCleanup() {
    try {
        console.log('1. Getting current settings...');
        const current = await chrome.storage.sync.get(['bookmarkMindSettings']);
        const currentSettings = current.bookmarkMindSettings || {};

        console.log('Current cleanup setting:', currentSettings.cleanupEmptyFolders);

        console.log('2. Disabling folder cleanup...');
        const updatedSettings = {
            ...currentSettings,
            cleanupEmptyFolders: false  // DISABLE to protect folders
        };

        await chrome.storage.sync.set({ bookmarkMindSettings: updatedSettings });

        console.log('✅ Folder cleanup DISABLED');
        console.log('🛡️  Your existing folders are now protected');
        console.log('📁 The extension will only ADD bookmarks to folders, never empty them');

        console.log('\n3. Verifying settings...');
        const verified = await chrome.storage.sync.get(['bookmarkMindSettings']);
        console.log('Verified cleanup setting:', verified.bookmarkMindSettings?.cleanupEmptyFolders);

        if (verified.bookmarkMindSettings?.cleanupEmptyFolders === false) {
            console.log('✅ PROTECTION CONFIRMED: Folder cleanup is disabled');
        } else {
            console.log('❌ WARNING: Folder cleanup might still be enabled');
        }

    } catch (error) {
        console.error('❌ Failed to disable cleanup:', error);
    }
}

// Run the protection
disableFolderCleanup();