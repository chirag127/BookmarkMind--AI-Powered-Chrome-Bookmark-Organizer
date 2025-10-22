// Configure hierarchical categorization settings
// Run this in the service worker console to customize the hierarchical behavior

console.log('⚙️ Configuring hierarchical categorization settings...');

async function configureHierarchicalSettings() {
    try {
        // Get current settings
        const current = await chrome.storage.sync.get(['bookmarkMindSettings']);
        const currentSettings = current.bookmarkMindSettings || {};

        console.log('Current settings:', currentSettings);

        // Update with hierarchical settings
        const updatedSettings = {
            ...currentSettings,
            hierarchicalMode: true,        // Enable hierarchical categories
            maxCategoryDepth: 4,          // Maximum 4 levels deep (e.g., Work > Dev > Frontend > React)
            minCategories: 20,            // Generate at least 20 categories
            maxCategories: 300,           // Generate up to 100 categories for maximum granularity
            autoSort: false,              // Don't auto-sort, let user control
            batchSize: 50                 // Process 50 bookmarks per batch
        };

        // Save updated settings
        await chrome.storage.sync.set({ bookmarkMindSettings: updatedSettings });

        console.log('✅ Hierarchical settings configured:');
        console.log('- Hierarchical Mode: ENABLED');
        console.log('- Maximum Depth: 4 levels');
        console.log('- Category Range: 20-100 categories');
        console.log('- Ultra-granular categorization enabled');

        console.log('\n🎯 This configuration will create:');
        console.log('- Very specific, deep category hierarchies');
        console.log('- Hundreds of granular subcategories');
        console.log('- 4-level folder structures like: Work > Development > Frontend > React > Hooks');
        console.log('- Personalized categories based on your actual bookmarks');

        console.log('\n🚀 Ready for hierarchical categorization!');
        console.log('Now try running the categorization from the popup or use test_full_hierarchical_system.js');

    } catch (error) {
        console.error('❌ Failed to configure settings:', error);
    }
}

// Configure the settings
configureHierarchicalSettings();