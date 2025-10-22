// Direct API Key Test - Run this in the service worker console
// Go to chrome://extensions/ → BookmarkMind → "Inspect views: service worker"

console.log('🔍 Direct API Key Test');
console.log('=====================');

async function testApiKeyDirect() {
    try {
        console.log('\n1. Getting API key from settings...');

        const settings = await chrome.storage.sync.get(['bookmarkMindSettings']);

        if (!settings.bookmarkMindSettings) {
            console.error('❌ No settings found');
            return;
        }

        if (!settings.bookmarkMindSettings.apiKey) {
            console.error('❌ No API key configured');
            return;
        }

        const apiKey = settings.bookmarkMindSettings.apiKey;
        console.log('✅ API key found, length:', apiKey.length);
        console.log('✅ Starts with AIza:', apiKey.startsWith('AIza'));

        console.log('\n2. Testing API key format...');
        if (!apiKey.startsWith('AIza')) {
            console.error('❌ API key should start with "AIza"');
            return;
        }

        if (apiKey.length < 35) {
            console.error('❌ API key too short, should be ~39 characters');
            return;
        }

        console.log('✅ API key format looks correct');

        console.log('\n3. Testing direct API call...');

        const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Hello, this is a test message. Please respond with "Test successful".'
                    }]
                }]
            })
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API call successful!');
            console.log('Response data:', data);

            if (data.candidates && data.candidates[0]) {
                const responseText = data.candidates[0].content.parts[0].text;
                console.log('AI Response:', responseText);
            }
        } else {
            const errorText = await response.text();
            console.error('❌ API call failed');
            console.error('Status:', response.status);
            console.error('Error:', errorText);

            // Parse error details
            try {
                const errorData = JSON.parse(errorText);
                console.error('Error details:', errorData);

                if (errorData.error) {
                    console.error('Error message:', errorData.error.message);
                    console.error('Error code:', errorData.error.code);
                }
            } catch (parseError) {
                console.error('Could not parse error response');
            }
        }

    } catch (error) {
        console.error('❌ Test failed with exception:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testApiKeyDirect();

console.log('\n📋 Instructions:');
console.log('1. Make sure you have configured your API key in extension settings');
console.log('2. Go to chrome://extensions/');
console.log('3. Find BookmarkMind → Click "Inspect views: service worker"');
console.log('4. Paste and run this script');
console.log('5. Check if the API call succeeds or what error you get');