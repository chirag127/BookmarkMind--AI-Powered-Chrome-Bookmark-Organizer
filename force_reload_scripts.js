// Force reload all scripts to ensure timeout changes take effect
// Run this in the service worker console

console.log('🔄 Force reloading all scripts...');

try {
    // Clear any existing classes
    if (typeof BookmarkService !== 'undefined') {
        console.log('Clearing existing BookmarkService...');
        delete self.BookmarkService;
    }

    if (typeof AIProcessor !== 'undefined') {
        console.log('Clearing existing AIProcessor...');
        delete self.AIProcessor;
    }

    if (typeof Categorizer !== 'undefined') {
        console.log('Clearing existing Categorizer...');
        delete self.Categorizer;
    }

    if (typeof FolderManager !== 'undefined') {
        console.log('Clearing existing FolderManager...');
        delete self.FolderManager;
    }

    console.log('Reloading scripts...');

    // Force reload all scripts
    importScripts(
        'bookmarkService.js',
        'aiProcessor.js',
        'categorizer.js',
        'folderManager.js'
    );

    console.log('✅ Scripts reloaded successfully!');
    console.log('Classes available:', {
        BookmarkService: typeof BookmarkService !== 'undefined',
        AIProcessor: typeof AIProcessor !== 'undefined',
        Categorizer: typeof Categorizer !== 'undefined',
        FolderManager: typeof FolderManager !== 'undefined'
    });

    console.log('🎯 Now test the timeout with test_timeout_fix.js');

} catch (error) {
    console.error('❌ Failed to reload scripts:', error);
}