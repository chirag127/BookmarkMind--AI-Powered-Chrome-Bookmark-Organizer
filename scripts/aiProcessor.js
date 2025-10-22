/**
 * BookmarkMind - AI Processor
 * Handles Gemini API integration for bookmark categorization
 */

class AIProcessor {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    /**
     * Initialize with API key
     * @param {string} apiKey - Gemini API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Categorize bookmarks using Gemini API
     * @param {Array} bookmarks - Array of bookmark objects
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Previous user corrections
     * @returns {Promise<Array>} Array of categorization results
     */
    async categorizeBookmarks(bookmarks, categories, learningData = {}) {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        if (!bookmarks || bookmarks.length === 0) {
            return [];
        }

        const results = [];
        const batchSize = 50; // Process in batches to avoid API limits

        for (let i = 0; i < bookmarks.length; i += batchSize) {
            const batch = bookmarks.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(bookmarks.length / batchSize);

            console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} bookmarks)`);

            try {
                // Add timeout for each batch
                const batchPromise = this._processBatch(batch, categories, learningData);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Batch timeout after 30 seconds')), 30000);
                });

                const batchResults = await Promise.race([batchPromise, timeoutPromise]);
                results.push(...batchResults);

                console.log(`✅ Batch ${batchNumber}/${totalBatches} completed successfully`);

                // Small delay between batches to respect rate limits
                if (i + batchSize < bookmarks.length) {
                    console.log(`Waiting 2 seconds before next batch...`);
                    await this._delay(2000); // Increased delay to be safer
                }
            } catch (error) {
                console.error(`❌ Error processing batch ${batchNumber}/${totalBatches}:`, error);

                // Add fallback categorization for failed batch
                batch.forEach((bookmark, index) => {
                    results.push({
                        id: i + index,
                        bookmarkId: bookmark.id,
                        category: 'Other',
                        confidence: 0.1
                    });
                });

                console.log(`⚠️ Batch ${batchNumber} failed, using fallback categorization`);
            }
        }

        return results;
    }

    /**
     * Process a batch of bookmarks
     * @param {Array} batch - Batch of bookmarks
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Learning data
     * @returns {Promise<Array>} Batch results
     */
    async _processBatch(batch, categories, learningData) {
        const prompt = this._buildPrompt(batch, categories, learningData);

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);

            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Gemini API key in settings. Make sure it starts with "AIza" and is from Google AI Studio.');
            } else if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
            } else if (response.status === 403) {
                throw new Error('API access denied. Please check your API key permissions and ensure Gemini API is enabled.');
            } else if (response.status === 400) {
                throw new Error('Bad request. Please check your API key format and try again.');
            } else {
                throw new Error(`API request failed: ${response.status}. ${errorText}`);
            }
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid API response format');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        return this._parseResponse(responseText, batch);
    }

    /**
     * Build prompt for Gemini API
     * @param {Array} bookmarks - Bookmarks to categorize
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Learning data
     * @returns {string} Formatted prompt
     */
    _buildPrompt(bookmarks, categories, learningData) {
        let prompt = `**Role:** Bookmark categorization assistant
**Task:** Analyze the following bookmarks and assign each to the most appropriate category from the user's category list.

**User Categories:** ${categories.join(', ')}

**Instructions:**
- Consider the bookmark's current folder location as a hint for categorization
- If a bookmark is already in a meaningful folder (like "Work" or "Shopping"), consider keeping it in a similar category
- Use URL domain, title content, and current folder context for better categorization
- Prioritize user's custom categories over generic ones

**Learning Data:** Based on previous user corrections, here are some patterns to follow:`;

        // Add learning data if available
        if (Object.keys(learningData).length > 0) {
            for (const [pattern, category] of Object.entries(learningData)) {
                prompt += `\n- URLs/titles containing "${pattern}" should be categorized as "${category}"`;
            }
        } else {
            prompt += '\n- No previous learning data available';
        }

        prompt += '\n\n**Bookmarks:**';

        bookmarks.forEach((bookmark, index) => {
            const title = bookmark.title || 'Untitled';
            const url = bookmark.url || '';
            const currentFolder = bookmark.currentFolderName || 'Unknown';
            const folderPath = bookmark.currentFolder || 'Root';

            prompt += `\n${index + 1}. Title: "${title}" URL: "${url}" Current Folder: "${currentFolder}" Path: "${folderPath}"`;
        });

        prompt += `\n\n**Output Requirements:**
- Return JSON array with same number of items as input bookmarks
- Each item must have 'id' (bookmark position 1-${bookmarks.length}), 'category' (assigned category), and 'confidence' (0.0-1.0)
- Use only categories from the user's list above
- If uncertain, use 'Other' category
- Consider URL domain, title content, AND current folder location for better categorization
- If current folder suggests a category (e.g., bookmark in "Work" folder), prefer work-related categories
- Return only the JSON array, no additional text or formatting`;

        return prompt;
    }

    /**
     * Parse API response
     * @param {string} responseText - Raw API response
     * @param {Array} batch - Original batch of bookmarks
     * @returns {Array} Parsed results
     */
    _parseResponse(responseText, batch) {
        try {
            // Clean the response text
            let cleanText = responseText.trim();

            // Remove markdown code blocks if present
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            // Try to find JSON array in the response
            const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanText = jsonMatch[0];
            }

            const parsed = JSON.parse(cleanText);

            if (!Array.isArray(parsed)) {
                throw new Error('Response is not an array');
            }

            // Map results to bookmark IDs
            return parsed.map((result, index) => ({
                id: result.id || (index + 1),
                bookmarkId: batch[index]?.id,
                category: result.category || 'Other',
                confidence: result.confidence || 0.5
            }));

        } catch (error) {
            console.error('Error parsing API response:', error);
            console.log('Raw response:', responseText);

            // Fallback: categorize all as 'Other'
            return batch.map((bookmark, index) => ({
                id: index + 1,
                bookmarkId: bookmark.id,
                category: 'Other',
                confidence: 0.1
            }));
        }
    }

    /**
     * Test API key validity
     * @returns {Promise<boolean>} True if API key is valid
     */
    async testApiKey() {
        if (!this.apiKey) {
            return false;
        }

        // Basic format validation
        if (!this.apiKey.startsWith('AIza') || this.apiKey.length < 35) {
            console.error('API key format invalid. Should start with "AIza" and be ~39 characters long.');
            return false;
        }

        try {
            // Simple test request
            const testResponse = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Hello, this is a test message.'
                        }]
                    }]
                })
            });

            if (testResponse.ok) {
                console.log('API key test successful');
                return true;
            } else {
                const errorText = await testResponse.text();
                console.error('API key test failed:', testResponse.status, errorText);
                return false;
            }
        } catch (error) {
            console.error('API key test failed:', error);
            return false;
        }
    }

    /**
     * Delay helper function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AIProcessor = AIProcessor;
}

// For service worker context (global scope)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.AIProcessor = AIProcessor;
}
self.AIProcessor = AIProcessor;
