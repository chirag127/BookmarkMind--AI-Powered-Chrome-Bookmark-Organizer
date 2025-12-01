// Manual Test Script - Run this in the POPUP console
// Right-click BookmarkMind popup → Inspect → Console → Paste this script

console.log('🔍 Manual Popup Test');
console.log('===================');

async function manualTest() {
    try {
        console.log('\n1. Testing message to background...');

        // Test simple message first
        const testResponse = await chrome.runtime.sendMessage({
            action: 'getStats'
        });

        console.log('Stats response:', testResponse);

        if (!testResponse) {
            console.error('❌ No response from background script');
            console.log('💡 Try: Reload extension and wait 5 seconds before testing');
            return;
        }

        if (!testResponse.success) {
            console.error('❌ Stats failed:', testResponse.error);
            return;
        }

        console.log('✅ Background communication working');

        console.log('\n2. Testing categorization message...');

        const categorizationResponse = await chrome.runtime.sendMessage({
            action: 'startCategorization',
            data: {}
        });

        console.log('Categorization response:', categorizationResponse);

        if (!categorizationResponse) {
            console.error('❌ No response from categorization');
            return;
        }

        if (categorizationResponse.success) {
            console.log('✅ Categorization successful!');
        } else {
            console.error('❌ Categorization failed:', categorizationResponse.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Run the test
manualTest();

console.log('\n📋 Instructions:');
console.log('1. Open BookmarkMind popup');
console.log('2. Right-click popup → Inspect');
console.log('3. Go to Console tab');
console.log('4. Paste and run this script');
console.log('5. Check the results above');