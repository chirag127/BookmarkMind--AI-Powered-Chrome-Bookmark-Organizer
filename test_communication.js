// Test Extension Communication - Run this in the popup console
// Right-click BookmarkMind popup → Inspect → Console → Paste this script

console.log('🔍 Testing Extension Communication');
console.log('=================================');

async function testCommunication() {
    try {
        console.log('\n1. Testing basic message...');

        const basicResponse = await chrome.runtime.sendMessage({
            action: 'getStats'
        });

        console.log('Basic response:', basicResponse);

        if (!basicResponse) {
            console.error('❌ No response from background script');
            console.log('💡 Background script may not be running');
            return;
        }

        if (basicResponse.success) {
            console.log('✅ Basic communication working');
        } else {
            console.error('❌ Basic communication failed:', basicResponse.error);
        }

        console.log('\n2. Testing API key message...');

        const apiTestResponse = await chrome.runtime.sendMessage({
            action: 'testApiKey',
            data: { apiKey: 'AIzaTestKey123456789012345678901234567' }
        });

        console.log('API test response:', apiTestResponse);

        if (!apiTestResponse) {
            console.error('❌ No response from API key test');
            return;
        }

        console.log('✅ API key message communication working');

        console.log('\n3. Testing categorization message...');

        // Add timeout to prevent hanging
        const categorizationPromise = chrome.runtime.sendMessage({
            action: 'startCategorization',
            data: {}
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
        });

        const categorizationResponse = await Promise.race([categorizationPromise, timeoutPromise]);

        console.log('Categorization response:', categorizationResponse);

        if (!categorizationResponse) {
            console.error('❌ No response from categorization');
            console.log('💡 This is likely the source of your "no response" error');
            return;
        }

        if (categorizationResponse.success) {
            console.log('✅ Categorization communication working');
        } else {
            console.error('❌ Categorization failed:', categorizationResponse.error);
        }

    } catch (error) {
        console.error('❌ Communication test failed:', error);

        if (error.message.includes('Timeout')) {
            console.log('💡 Background script is not responding - this causes "no response" error');
        } else if (error.message.includes('Could not establish connection')) {
            console.log('💡 Background script is not running - reload the extension');
        }
    }
}

// Run the test
testCommunication();

console.log('\n📋 Instructions:');
console.log('1. Open BookmarkMind popup');
console.log('2. Right-click popup → Inspect');
console.log('3. Go to Console tab');
console.log('4. Paste and run this script');
console.log('5. Check which step fails');