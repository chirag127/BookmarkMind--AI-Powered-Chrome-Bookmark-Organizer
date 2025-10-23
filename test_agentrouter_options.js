// Test the options page AgentRouter integration
// Run this in the browser console on the options page

console.log('🔍 Testing options page AgentRouter integration...');

function testOptionsPage() {
    console.log('1. Checking AgentRouter elements...');

    const elements = {
        agentRouterInput: document.getElementById('agentRouterApiKey'),
        toggleBtn: document.getElementById('toggleAgentRouterKey'),
        clearBtn: document.getElementById('clearAgentRouterKey'),
        testBtn: document.getElementById('testAgentRouterKey'),
        status: document.getElementById('agentRouterKeyStatus')
    };

    console.log('AgentRouter elements found:', {
        input: !!elements.agentRouterInput,
        toggle: !!elements.toggleBtn,
        clear: !!elements.clearBtn,
        test: !!elements.testBtn,
        status: !!elements.status
    });

    if (elements.agentRouterInput) {
        console.log('✅ AgentRouter API key input found');
        console.log('Placeholder:', elements.agentRouterInput.placeholder);
    } else {
        console.log('❌ AgentRouter API key input not found');
    }

    console.log('2. Testing input validation...');

    if (elements.agentRouterInput) {
        // Test invalid key
        elements.agentRouterInput.value = 'invalid-key';
        elements.agentRouterInput.dispatchEvent(new Event('input'));
        console.log('Invalid key test - Test button disabled:', elements.testBtn?.disabled);

        // Test valid key format
        elements.agentRouterInput.value = 'sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef';
        elements.agentRouterInput.dispatchEvent(new Event('input'));
        console.log('Valid key test - Test button enabled:', !elements.testBtn?.disabled);

        // Clear for safety
        elements.agentRouterInput.value = '';
        elements.agentRouterInput.dispatchEvent(new Event('input'));
    }

    console.log('3. Testing toggle functionality...');
    if (elements.toggleBtn) {
        console.log('Toggle button found, testing click...');
        elements.toggleBtn.click();
        console.log('Toggle clicked - input type:', elements.agentRouterInput?.type);
    }

    console.log('4. Checking save button behavior...');
    const saveBtn = document.getElementById('saveApiKey');
    if (saveBtn) {
        console.log('Save button text:', saveBtn.textContent);
        console.log('Should say "Save API Keys" (plural)');
    }

    console.log('🎉 Options page test completed!');
    console.log('You can now:');
    console.log('- Enter AgentRouter API key (get from https://agentrouter.org)');
    console.log('- Test the key with the "Test AgentRouter Key" button');
    console.log('- Save both Gemini and AgentRouter keys together');
    console.log('- AgentRouter will be used as fallback when Gemini API fails');
}

// Run the test
testOptionsPage();