// Test message flow between popup and background
// Run this in the popup console (F12 on popup)

console.log('🔍 Testing message flow...');

async function testMessageFlow() {
    try {
        console.log('1. Testing ping...');
        const pingResponse = await chrome.runtime.sendMessage({ action: 'ping' });
        console.log('Ping response:', pingResponse);

        if (!pingResponse || !pingResponse.success) {
            throw new Error('Background script not responding to ping');
        }

        console.log('2. Testing stats...');
        const statsResponse = await chrome.runtime.sendMessage({ action: 'getStats' });
        console.log('Stats response:', statsResponse);

        if (!statsResponse || !statsResponse.success) {
            throw new Error('Background script not responding to stats request');
        }

        console.log('3. Testing categorization message (without actually running it)...');
        // We'll just test if the message gets through, not run full categorization

        console.log('✅ Message flow working!');
        console.log('Now testing actual categorization...');

        // Test actual categorization
        const categorizationResponse = await chrome.runtime.sendMessage({
            action: 'startCategorization',
            data: { forceReorganize: false }
        });

        console.log('Categorization response:', categorizationResponse);

        if (categorizationResponse && categorizationResponse.success) {
            console.log('✅ Categorization completed successfully!');
        } else {
            console.error('❌ Categorization failed:', categorizationResponse?.error);
        }

    } catch (error) {
        console.error('❌ Message flow test failed:', error);
    }
}

// Run the test
testMessageFlow();