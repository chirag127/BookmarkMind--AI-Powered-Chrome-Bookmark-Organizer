/**
 * BookmarkMind - AI Processor
 * Handles Gemini API integration for bookmark categorization
 */

class AIProcessor {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        this.bookmarkService = null;
    }

    /**
     * Initialize with API key
     * @param {string} apiKey - Gemini API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        // Initialize BookmarkService for folder creation
        if (typeof BookmarkService !== 'undefined') {
            this.bookmarkService = new BookmarkService();
        }
    }

    /**
     * Categorize bookmarks using Gemini API with dynamic category generation
     * @param {Array} bookmarks - Array of bookmark objects
     * @param {Array} suggestedCategories - Suggested categories (optional)
     * @param {Object} learningData - Previous user corrections
     * @returns {Promise<Object>} Object with categories and categorization results
     */
    async categorizeBookmarks(bookmarks, suggestedCategories = [], learningData = {}) {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        if (!bookmarks || bookmarks.length === 0) {
            return { categories: [], results: [] };
        }

        // First, analyze bookmarks to generate dynamic categories
        console.log('Generating dynamic categories from bookmarks...');
        const dynamicCategories = await this._generateDynamicCategories(bookmarks, suggestedCategories, learningData);
        console.log('Generated categories:', dynamicCategories);

        // IMMEDIATELY create folder structure for all generated categories
        console.log('🏗️  Creating folder structure for all generated categories...');
        await this._createFolderStructure(dynamicCategories);

        const results = [];
        const batchSize = 10; // Very small batch size for reliable hierarchical processing

        for (let i = 0; i < bookmarks.length; i += batchSize) {
            const batch = bookmarks.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(bookmarks.length / batchSize);

            console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} bookmarks)`);

            try {
                // Add timeout for each batch (very long timeout for hierarchical processing)
                const batchPromise = this._processBatch(batch, dynamicCategories, learningData);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Batch timeout after 10 minutes')), 600000); // 10 minutes timeout
                });

                const batchResults = await Promise.race([batchPromise, timeoutPromise]);
                results.push(...batchResults);

                console.log(`✅ Batch ${batchNumber}/${totalBatches} completed successfully`);

                // Longer delay between batches for hierarchical processing
                if (i + batchSize < bookmarks.length) {
                    console.log(`Waiting 10 seconds before next batch...`);
                    await this._delay(10000); // Long delay to avoid rate limiting
                }
            } catch (error) {
                console.error(`❌ Error processing batch ${batchNumber}/${totalBatches}:`, error);

                // Add SMART fallback categorization using generated categories
                batch.forEach((bookmark, index) => {
                    let fallbackCategory = 'Other';

                    if (bookmark.title && bookmark.url && dynamicCategories.length > 1) {
                        const title = bookmark.title.toLowerCase();
                        const url = bookmark.url.toLowerCase();

                        // Extract domain for better matching
                        let domain = '';
                        try {
                            domain = new URL(bookmark.url).hostname.replace('www.', '').toLowerCase();
                        } catch (e) {
                            domain = '';
                        }

                        // Smart keyword matching to assign to generated categories
                        let bestMatch = null;
                        let bestScore = 0;

                        for (const category of dynamicCategories) {
                            if (category === 'Other') continue;

                            const categoryLower = category.toLowerCase();
                            const categoryParts = categoryLower.split(' > ');
                            let score = 0;

                            // Check matches in title, URL, and domain
                            categoryParts.forEach(part => {
                                if (title.includes(part)) score += 3;
                                if (url.includes(part)) score += 2;
                                if (domain.includes(part)) score += 4;
                            });

                            // Bonus scoring for common patterns
                            if (categoryLower.includes('ai') && (title.includes('ai') || domain.includes('ai') || title.includes('artificial'))) score += 5;
                            if (categoryLower.includes('development') && (domain.includes('github') || domain.includes('stackoverflow') || title.includes('code'))) score += 5;
                            if (categoryLower.includes('learning') && (domain.includes('course') || title.includes('tutorial') || domain.includes('edu'))) score += 5;
                            if (categoryLower.includes('shopping') && (domain.includes('amazon') || domain.includes('shop') || title.includes('buy'))) score += 5;
                            if (categoryLower.includes('tools') && (title.includes('tool') || title.includes('app') || domain.includes('app'))) score += 3;

                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = category;
                            }
                        }

                        if (bestMatch && bestScore > 0) {
                            fallbackCategory = bestMatch;
                            console.log(`🎯 Smart fallback: "${bookmark.title}" → "${fallbackCategory}" (score: ${bestScore})`);
                        } else {
                            // If no good match, try to use a general category from the generated list
                            const generalCategories = dynamicCategories.filter(cat =>
                                cat !== 'Other' &&
                                cat.split(' > ').length <= 2 // Use broader categories
                            );

                            if (generalCategories.length > 0) {
                                // Distribute among general categories to avoid everything going to "Other"
                                fallbackCategory = generalCategories[index % generalCategories.length];
                                console.log(`📂 General fallback: "${bookmark.title}" → "${fallbackCategory}"`);
                            }
                        }
                    }

                    results.push({
                        id: i + index,
                        bookmarkId: bookmark.id,
                        category: fallbackCategory,
                        confidence: fallbackCategory === 'Other' ? 0.1 : 0.3
                    });
                });

                console.log(`⚠️ Batch ${batchNumber} failed, using fallback categorization`);
            }
        }

        return {
            categories: dynamicCategories,
            results: results
        };
    }

    /**
     * Generate dynamic hierarchical categories based on bookmark analysis
     * @param {Array} bookmarks - All bookmarks to analyze
     * @param {Array} suggestedCategories - Optional suggested categories
     * @param {Object} learningData - Learning data
     * @returns {Promise<Array>} Generated hierarchical categories
     */
    async _generateDynamicCategories(bookmarks, suggestedCategories = [], learningData = {}) {
        // Take a sample of bookmarks for category generation (max 150 for better analysis)
        const sampleBookmarks = bookmarks.slice(0, Math.min(150, bookmarks.length));

        // Get user preferences for hierarchical categories
        const settings = await this._getSettings();
        const maxDepth = settings.maxCategoryDepth || 4;
        const minCategories = settings.minCategories || 15;
        const maxCategories = settings.maxCategories || 50;
        const hierarchicalMode = settings.hierarchicalMode !== false; // Default to true

        let prompt = `**Role:** Advanced Hierarchical Bookmark Category Generator
**Task:** Analyze the following bookmarks and create a comprehensive hierarchical category system with multiple levels of granularity.

**HIERARCHICAL CATEGORY REQUIREMENTS:**
- Create ${minCategories}-${maxCategories} hierarchical categories with 2-${maxDepth} levels deep
- Use format: "Parent > Child > Grandchild > Great-grandchild"
- Examples: "Work > Development > Frontend > React", "Learning > Programming > JavaScript > Frameworks"
- Be extremely specific and granular - hundreds of categories are encouraged
- Consider domain expertise, content type, and usage patterns
- Include both broad categories and very specific subcategories
- Maximum depth: ${maxDepth} levels (e.g., Level1 > Level2 > Level3 > Level4)

**Current Bookmark Sample (${sampleBookmarks.length} bookmarks):**`;

        sampleBookmarks.forEach((bookmark, index) => {
            const title = bookmark.title || 'Untitled';
            const url = bookmark.url || '';
            const currentFolder = bookmark.currentFolderName || 'Root';
            let domain = 'unknown';
            try {
                if (url) {
                    domain = new URL(url).hostname.replace('www.', '');
                }
            } catch (e) {
                domain = 'invalid-url';
            }

            prompt += `\n${index + 1}. "${title}" (${domain}) - Currently in: ${currentFolder}`;
        });

        prompt += `\n\n**Suggested Categories (optional reference):** ${suggestedCategories.join(', ')}

**Learning Data:** Based on user preferences:`;

        if (Object.keys(learningData).length > 0) {
            for (const [pattern, category] of Object.entries(learningData)) {
                prompt += `\n- "${pattern}" → "${category}"`;
            }
        } else {
            prompt += '\n- No previous learning data available';
        }

        prompt += `\n\n**HIERARCHICAL CATEGORY INSTRUCTIONS:**
- Analyze bookmark titles, domains, current folders, and content patterns
- Create hierarchical categories with 2-4 levels using " > " separator
- Generate 15-25 main category trees, each with multiple subcategories
- Be extremely granular - create hundreds of specific subcategories
- Categories should be:
  * Very specific and detailed (e.g., "Work > Development > Frontend > React > Hooks")
  * Organized by domain expertise and content type
  * Based on actual bookmark content and usage patterns
  * Include both broad and ultra-specific categories

**CATEGORY EXAMPLES:**
- "Work > Development > Frontend > JavaScript > React"
- "Work > Development > Backend > APIs > REST"
- "Work > Development > DevOps > Docker > Containers"
- "Learning > Programming > Languages > Python > Data Science"
- "Learning > Design > UI-UX > Figma > Prototyping"
- "Personal > Finance > Investment > Stocks > Analysis"
- "Personal > Health > Fitness > Workouts > Strength Training"
- "Entertainment > Gaming > PC Games > Strategy > RTS"
- "Shopping > Tech > Computers > Laptops > Gaming"
- "News > Technology > AI > Machine Learning > LLMs"
- "Tools > Productivity > Project Management > Agile > Scrum"
- "Reference > Documentation > APIs > Web APIs > REST"

**OUTPUT FORMAT:**
Return a JSON array of hierarchical category paths, like:
[
  "Work > Development > Frontend > React",
  "Work > Development > Backend > Node.js",
  "Learning > Programming > Python > Data Science",
  "Personal > Finance > Investment > Stocks",
  "Entertainment > Gaming > PC Games",
  "Other"
]

**IMPORTANT:**
- Use " > " (space-greater-than-space) as the separator
- Create very specific subcategories based on the actual bookmarks you see
- Generate 15-25 category trees minimum
- Always include "Other" as the last category
- Be as granular as possible - hundreds of categories are encouraged

Return only the JSON array, no additional text or formatting.`;

        try {
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
                console.error('Category generation failed, using fallback categories');
                return this._getFallbackCategories(suggestedCategories);
            }

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!responseText) {
                console.error('Invalid category generation response, using fallback');
                return this._getFallbackCategories(suggestedCategories);
            }

            // Parse the generated categories
            const cleanText = responseText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const jsonMatch = cleanText.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const categories = JSON.parse(jsonMatch[0]);
                if (Array.isArray(categories) && categories.length > 0) {
                    // Ensure "Other" is always included
                    if (!categories.includes('Other')) {
                        categories.push('Other');
                    }
                    console.log('Successfully generated dynamic categories:', categories);
                    return categories;
                }
            }

            console.error('Failed to parse generated categories, using fallback');
            return this._getFallbackCategories(suggestedCategories);

        } catch (error) {
            console.error('Error generating categories:', error);
            return this._getFallbackCategories(suggestedCategories);
        }
    }

    /**
     * Create folder structure immediately for all generated categories
     * @param {Array} categories - Generated hierarchical categories
     */
    async _createFolderStructure(categories) {
        console.log(`🏗️  Creating folder structure for ${categories.length} categories...`);

        // Use existing BookmarkService instance or create new one
        if (!this.bookmarkService) {
            if (typeof BookmarkService === 'undefined') {
                throw new Error('BookmarkService not available for folder creation');
            }
            this.bookmarkService = new BookmarkService();
        }
        let createdCount = 0;
        let skippedCount = 0;

        for (const category of categories) {
            if (category === 'Other') {
                skippedCount++;
                continue; // Skip "Other" as it's not a hierarchical category
            }

            try {
                console.log(`📁 Creating: ${category}`);
                const folderId = await this.bookmarkService.findOrCreateFolderByPath(category, '1');
                console.log(`✅ Created: ${category} → ${folderId}`);
                createdCount++;

                // Small delay to avoid overwhelming the API
                await this._delay(100);

            } catch (error) {
                console.error(`❌ Failed to create folder: ${category}`, error);
            }
        }

        console.log(`🎉 Folder structure creation complete: ${createdCount} created, ${skippedCount} skipped`);
    }

    /**
     * Get fallback hierarchical categories when dynamic generation fails
     * @param {Array} suggestedCategories - Suggested categories
     * @returns {Array} Fallback hierarchical categories
     */
    _getFallbackCategories(suggestedCategories = []) {
        if (suggestedCategories.length > 0) {
            return [...suggestedCategories, 'Other'];
        }

        return [
            'Work > Development > Frontend > JavaScript',
            'Work > Development > Frontend > CSS',
            'Work > Development > Backend > APIs',
            'Work > Development > DevOps > Tools',
            'Work > Design > UI-UX > Resources',
            'Work > Design > Graphics > Tools',
            'Work > Business > Marketing > Digital',
            'Work > Business > Finance > Tools',
            'Learning > Programming > Languages > JavaScript',
            'Learning > Programming > Languages > Python',
            'Learning > Programming > Frameworks > React',
            'Learning > Design > Tutorials > UI-UX',
            'Learning > Technology > AI > Machine Learning',
            'Learning > Business > Entrepreneurship > Startups',
            'Personal > Finance > Investment > Stocks',
            'Personal > Finance > Banking > Tools',
            'Personal > Health > Fitness > Workouts',
            'Personal > Travel > Planning > Destinations',
            'Entertainment > Gaming > PC Games > Strategy',
            'Entertainment > Gaming > Mobile Games > Casual',
            'Entertainment > Media > Streaming > Movies',
            'Entertainment > Media > Music > Platforms',
            'Shopping > Technology > Computers > Hardware',
            'Shopping > Technology > Software > Tools',
            'Shopping > Lifestyle > Fashion > Clothing',
            'Shopping > Home > Furniture > Decor',
            'News > Technology > Industry > Updates',
            'News > Business > Markets > Analysis',
            'News > World > Politics > Current Events',
            'Tools > Productivity > Project Management > Agile',
            'Tools > Productivity > Note Taking > Apps',
            'Tools > Development > Code Editors > Extensions',
            'Tools > Design > Graphics > Software',
            'Reference > Documentation > APIs > Web Services',
            'Reference > Tutorials > Programming > Guides',
            'Social > Networking > Professional > LinkedIn',
            'Social > Communication > Messaging > Apps',
            'Other'
        ];
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

**HIERARCHICAL CATEGORIZATION INSTRUCTIONS:**
- Assign each bookmark to the most specific hierarchical category possible
- Consider current folder location, URL domain, title content, and page context
- Use the full hierarchical path (e.g., "Work > Development > Frontend > React")
- Be as granular as possible - prefer deeper, more specific categories
- If current folder suggests a category tree, use similar hierarchical structure
- Create new subcategories when needed for better organization

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
            const currentFolder = bookmark.currentFolderName || 'Root';
            const folderPath = bookmark.currentFolder || 'Root';
            let domain = 'unknown';
            try {
                if (url) {
                    domain = new URL(url).hostname.replace('www.', '');
                }
            } catch (e) {
                domain = 'invalid-url';
            }

            prompt += `\n${index + 1}. Title: "${title}" | Domain: "${domain}" | URL: "${url}" | Current Location: "${currentFolder}" (${folderPath})`;
        });

        prompt += `\n\n**HIERARCHICAL OUTPUT REQUIREMENTS:**
- Return JSON array with same number of items as input bookmarks
- Each item must have 'id' (bookmark position 1-${bookmarks.length}), 'category' (full hierarchical path), and 'confidence' (0.0-1.0)
- Use hierarchical categories from the generated list above
- Category must be the full path (e.g., "Work > Development > Frontend > React")
- Be as specific as possible - use the deepest appropriate category level
- If uncertain, use 'Other' category
- Consider URL domain, title content, AND current folder location for granular categorization
- Prefer deeper, more specific categories over shallow ones

**EXAMPLE OUTPUT:**
[
  {"id": 1, "category": "Work > Development > Frontend > React", "confidence": 0.9},
  {"id": 2, "category": "Learning > Programming > Python > Data Science", "confidence": 0.8},
  {"id": 3, "category": "Personal > Finance > Investment > Stocks", "confidence": 0.7}
]

Return only the JSON array, no additional text or formatting`;

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
     * Get user settings
     * @returns {Promise<Object>} User settings
     */
    async _getSettings() {
        const defaultSettings = {
            hierarchicalMode: true,
            maxCategoryDepth: 4,
            minCategories: 15,
            maxCategories: 50
        };

        try {
            const result = await chrome.storage.sync.get(['bookmarkMindSettings']);
            return { ...defaultSettings, ...result.bookmarkMindSettings };
        } catch (error) {
            console.error('Error getting settings:', error);
            return defaultSettings;
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
