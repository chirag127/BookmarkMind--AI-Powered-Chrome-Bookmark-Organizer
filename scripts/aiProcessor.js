/**
 * BookmarkMind - AI Processor
 * Handles Gemini API integration for bookmark categorization
 */

class AIProcessor {
    constructor() {
        this.apiKey = null;
        this.bookmarkService = null;

        // Gemini model fallback sequence - try models in order when one fails
        this.geminiModels = [
            'gemini-2.5-pro',
            'gemini-2.5-flash-preview-09-2025',
            'gemini-2.5-flash',
            'gemini-2.5-flash-image',
            'gemini-2.0-flash',
            'gemini-2.5-flash-lite-preview-09-2025',
            'gemini-2.5-flash-lite'
        ];
        this.currentModelIndex = 0;
        this.baseUrlTemplate = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent';

        // AgentRouter fallback configuration
        this.agentRouterApiKey = null;
        this.agentRouterBaseUrl = 'https://agentrouter.org/v1/chat/completions';
        this.fallbackModel = 'gpt-5'; // Free model on AgentRouter
    }

    /**
     * Get the current Gemini model URL
     * @returns {string} Current model URL
     */
    getCurrentModelUrl() {
        const currentModel = this.geminiModels[this.currentModelIndex];
        return this.baseUrlTemplate.replace('{model}', currentModel);
    }

    /**
     * Get the current Gemini model name
     * @returns {string} Current model name
     */
    getCurrentModelName() {
        return this.geminiModels[this.currentModelIndex];
    }

    /**
     * Try next Gemini model in the fallback sequence
     * @returns {boolean} True if there's a next model, false if exhausted
     */
    tryNextGeminiModel() {
        if (this.currentModelIndex < this.geminiModels.length - 1) {
            this.currentModelIndex++;
            console.log(`🔄 Switching to next Gemini model: ${this.getCurrentModelName()}`);
            return true;
        }
        console.log('⚠️ All Gemini models exhausted, no more fallbacks available');
        return false;
    }

    /**
     * Reset to first Gemini model (for new categorization sessions)
     */
    resetToFirstModel() {
        this.currentModelIndex = 0;
        console.log(`🔄 Reset to first Gemini model: ${this.getCurrentModelName()}`);
    }

    /**
     * Initialize with API key
     * @param {string} apiKey - Gemini API key
     * @param {string} agentRouterKey - Optional AgentRouter API key for fallback
     */
    setApiKey(apiKey, agentRouterKey = null) {
        this.apiKey = apiKey;
        this.agentRouterApiKey = agentRouterKey;
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

        // Reset to first Gemini model at the start of each categorization session
        this.resetToFirstModel();

        // First, analyze bookmarks to generate dynamic categories
        console.log('Generating dynamic categories from bookmarks...');
        const dynamicCategories = await this._generateDynamicCategories(bookmarks, suggestedCategories, learningData);
        console.log('Generated categories:', dynamicCategories);

        // Don't create folder structure upfront - create folders only when bookmarks are actually moved to them
        console.log('🏗️  Folder structure will be created on-demand as bookmarks are categorized...');

        // Get batch size from user settings first
        const settings = await this._getSettings();
        const batchSize = settings.batchSize || 50; // Default to 50 if not set
        console.log(`📦 Using batch size: ${batchSize} bookmarks per API call`);

        const results = [];

        // Process bookmarks in configurable BATCHES and MOVE IMMEDIATELY after each batch categorization
        console.log(`🔍 Processing ${bookmarks.length} bookmarks in batches of ${batchSize} with IMMEDIATE MOVEMENT...`);

        // DEBUG: Check if method exists
        console.log('🔧 DEBUG: _moveBookmarkImmediately method exists:', typeof this._moveBookmarkImmediately === 'function');
        console.log('🔧 DEBUG: _createFolderDirect method exists:', typeof this._createFolderDirect === 'function');

        // Initialize BookmarkService if not already done
        if (!this.bookmarkService && typeof BookmarkService !== 'undefined') {
            this.bookmarkService = new BookmarkService();
        }

        let successfulMoves = 0;
        let failedMoves = 0;

        // Process bookmarks in batches
        for (let i = 0; i < bookmarks.length; i += batchSize) {
            const batch = bookmarks.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(bookmarks.length / batchSize);

            console.log(`\n📦 === PROCESSING BATCH ${batchNumber}/${totalBatches} (${batch.length} bookmarks) ===`);
            console.log(`📋 Batch bookmarks:`);
            batch.forEach((bookmark, idx) => {
                console.log(`   ${i + idx + 1}. "${bookmark.title}" - ${bookmark.url?.substring(0, 50)}...`);
            });

            try {
                // Process entire batch with AI (50 bookmarks at once)
                console.log(`🤖 Sending batch of ${batch.length} bookmarks to Gemini AI...`);

                const batchPromise = this._processBatch(batch, dynamicCategories, learningData);
                // Dynamic timeout based on batch size (6 seconds per bookmark, minimum 2 minutes)
                const timeoutMs = Math.max(120000, batch.length * 6000);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Batch timeout after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs);
                });

                const batchResults = await Promise.race([batchPromise, timeoutPromise]);

                if (batchResults && batchResults.length > 0) {
                    console.log(`✅ AI BATCH CATEGORIZATION SUCCESS: ${batchResults.length} bookmarks categorized`);

                    // Show categorization results
                    batchResults.forEach((result, idx) => {
                        const bookmark = batch[idx];
                        console.log(`   ${i + idx + 1}. "${bookmark?.title}" → "${result.category}" (confidence: ${result.confidence})`);
                    });

                    // IMMEDIATELY MOVE each bookmark in the batch after categorization
                    console.log(`🚚 IMMEDIATE BATCH MOVEMENT: Moving ${batchResults.length} bookmarks...`);

                    for (let j = 0; j < batchResults.length; j++) {
                        const result = batchResults[j];
                        const bookmark = batch[j];
                        const globalBookmarkNumber = i + j + 1;

                        try {
                            if (typeof this._moveBookmarkImmediately === 'function') {
                                await this._moveBookmarkImmediately(bookmark, result.category, result.title, globalBookmarkNumber, bookmarks.length);
                            } else {
                                // Inline movement as fallback
                                console.log(`🚚 INLINE MOVEMENT: Moving bookmark ${globalBookmarkNumber}/${bookmarks.length}...`);
                                const folderId = await this._createFolderDirect(result.category, '1');
                                await chrome.bookmarks.update(bookmark.id, { title: result.title, url: bookmark.url });
                                await chrome.bookmarks.move(bookmark.id, { parentId: folderId });
                                console.log(`✅ INLINE MOVEMENT COMPLETE: "${result.title}" moved to "${result.category}"`);
                            }
                            results.push(result);
                            successfulMoves++;
                        } catch (moveError) {
                            console.error(`❌ MOVEMENT FAILED for bookmark ${globalBookmarkNumber}: ${moveError.message}`);
                            // Still add to results even if movement failed
                            results.push(result);
                            successfulMoves++;
                        }
                    }

                } else {
                    throw new Error('No results returned from AI batch processing');
                }

            } catch (error) {
                console.error(`❌ AI BATCH CATEGORIZATION FAILED for batch ${batchNumber}: ${error.message}`);

                // Show error notification to user instead of using fallback categories
                const errorMessage = `Failed to categorize batch ${batchNumber}/${totalBatches}. ${error.message}`;
                console.error(`🚨 CATEGORIZATION ERROR: ${errorMessage}`);

                // Send error notification to popup/options page
                try {
                    await chrome.runtime.sendMessage({
                        type: 'CATEGORIZATION_ERROR',
                        message: errorMessage,
                        batch: batchNumber,
                        totalBatches: totalBatches
                    });
                } catch (notificationError) {
                    console.error('Failed to send error notification:', notificationError);
                }

                // Stop processing and throw error instead of continuing with fallback
                throw new Error(`Categorization failed for batch ${batchNumber}: ${error.message}`);
            }

            // Delay between batches to avoid rate limiting
            if (i + batchSize < bookmarks.length) {
                console.log(`⏳ Waiting 10 seconds before next batch...`);
                await this._delay(10000);
            }
        }

        console.log(`\n🎯 === BATCH PROCESSING COMPLETE ===`);
        console.log(`📊 Total bookmarks processed: ${results.length}`);
        console.log(`✅ Successfully moved (AI): ${successfulMoves} bookmarks`);
        console.log(`⚠️ Fallback moved: ${failedMoves} bookmarks`);
        console.log(`📁 Categories available: ${dynamicCategories.length}`);
        console.log(`📋 Categories: ${dynamicCategories.join(', ')}`);
        console.log(`🚀 Batch size used: ${batchSize} bookmarks per API call (configurable in options)`);

        // Show category distribution
        const categoryCount = {};
        results.forEach(result => {
            categoryCount[result.category] = (categoryCount[result.category] || 0) + 1;
        });

        console.log(`📈 Category distribution:`);
        Object.entries(categoryCount).forEach(([category, count]) => {
            console.log(`   ${category}: ${count} bookmarks`);
        });

        return {
            categories: dynamicCategories,
            results: results
        };
    }

    /**
     * Move bookmark immediately after categorization and update title
     * @param {Object} bookmark - Bookmark object
     * @param {string} category - Category to move to
     * @param {string} newTitle - New AI-generated title
     * @param {number} bookmarkNumber - Current bookmark number
     * @param {number} totalBookmarks - Total bookmarks being processed
     */
    async _moveBookmarkImmediately(bookmark, category, newTitle, bookmarkNumber, totalBookmarks) {
        console.log(`🚚 IMMEDIATE MOVEMENT: Moving bookmark ${bookmarkNumber}/${totalBookmarks}...`);

        // Get current folder name before moving
        let currentFolderName = 'Unknown';
        try {
            if (bookmark.parentId) {
                const currentParent = await chrome.bookmarks.get(bookmark.parentId);
                currentFolderName = currentParent[0].title;
            }
        } catch (error) {
            currentFolderName = `ID:${bookmark.parentId}`;
        }

        // Create folder structure and get folder ID
        const rootFolderId = '1'; // Always use Bookmarks Bar
        const folderId = await this._createFolderDirect(category, rootFolderId);

        // Get destination folder name
        let destinationFolderName = 'Unknown';
        try {
            const destinationFolder = await chrome.bookmarks.get(folderId);
            destinationFolderName = destinationFolder[0].title;
        } catch (error) {
            destinationFolderName = `ID:${folderId}`;
        }

        console.log(`📋 MOVING & UPDATING BOOKMARK:`);
        console.log(`   📖 Original Title: "${bookmark.title}"`);
        console.log(`   ✨ New AI Title: "${newTitle}"`);
        console.log(`   � FROM: "d${currentFolderName}" (ID: ${bookmark.parentId})`);
        console.log(`   📁 TO: "${destinationFolderName}" (ID: ${folderId})`);
        console.log(`   🎯 Category: "${category}"`);

        // Update bookmark title and move it using direct Chrome API
        await chrome.bookmarks.update(bookmark.id, {
            title: newTitle,
            url: bookmark.url // Keep the same URL
        });

        await chrome.bookmarks.move(bookmark.id, { parentId: folderId });

        console.log(`   ✅ MOVEMENT & TITLE UPDATE COMPLETE: "${newTitle}" successfully moved from "${currentFolderName}" to "${destinationFolderName}"`);
    }

    /**
     * Create folder directly only when needed (prevents empty folder creation)
     * @param {string} categoryPath - Category path (e.g., "Work/Projects")
     * @param {string} rootFolderId - Root folder ID
     * @returns {Promise<string>} Folder ID
     */
    async _createFolderDirect(categoryPath, rootFolderId) {
        // Skip creating "Other" folder - bookmarks stay in root
        if (categoryPath === 'Other') {
            return rootFolderId;
        }

        const parts = categoryPath.split(' > ').map(part => part.trim());
        let currentParentId = rootFolderId;

        console.log(`📁 Creating folder structure for: "${categoryPath}"`);

        for (const part of parts) {
            // Check if folder already exists
            const children = await chrome.bookmarks.getChildren(currentParentId);
            let existingFolder = children.find(child => !child.url && child.title === part);

            if (!existingFolder) {
                // Create the folder only when we actually need it
                existingFolder = await chrome.bookmarks.create({
                    parentId: currentParentId,
                    title: part
                });
                console.log(`📁 Created on-demand folder: "${part}" in parent ${currentParentId}`);
            } else {
                console.log(`📁 Using existing folder: "${part}" (ID: ${existingFolder.id})`);
            }

            currentParentId = existingFolder.id;
        }

        return currentParentId;
    }

    /**
     * Generate a fallback title when AI fails
     * @param {Object} bookmark - Bookmark object
     * @returns {string} Generated fallback title
     */
    _generateFallbackTitle(bookmark) {
        const originalTitle = bookmark.title || 'Untitled';

        try {
            if (bookmark.url) {
                const url = new URL(bookmark.url);
                const domain = url.hostname.replace('www.', '');

                // If title is generic or just domain, enhance it
                if (originalTitle === domain ||
                    originalTitle.toLowerCase() === 'home' ||
                    originalTitle.toLowerCase() === 'dashboard' ||
                    originalTitle.length < 10) {

                    // Create a better title based on domain
                    const domainParts = domain.split('.');
                    const siteName = domainParts[0];

                    // Common site enhancements
                    const siteEnhancements = {
                        'github': 'GitHub - Code Repository Platform',
                        'stackoverflow': 'Stack Overflow - Programming Q&A',
                        'youtube': 'YouTube - Video Streaming Platform',
                        'netflix': 'Netflix - Streaming Movies & TV Shows',
                        'amazon': 'Amazon - Online Shopping & Services',
                        'google': 'Google - Search & Web Services',
                        'microsoft': 'Microsoft - Technology & Cloud Services',
                        'apple': 'Apple - Technology & Products',
                        'facebook': 'Facebook - Social Media Platform',
                        'twitter': 'Twitter - Social Media & News',
                        'linkedin': 'LinkedIn - Professional Network',
                        'reddit': 'Reddit - Social News & Discussion',
                        'wikipedia': 'Wikipedia - Free Encyclopedia',
                        'medium': 'Medium - Publishing Platform'
                    };

                    return siteEnhancements[siteName.toLowerCase()] || `${siteName.charAt(0).toUpperCase() + siteName.slice(1)} - ${domain}`;
                }
            }
        } catch (error) {
            console.log('Error generating fallback title:', error);
        }

        // Return original title if no enhancement needed
        return originalTitle;
    }

    /**
     * Get existing folder structure to avoid creating duplicates
     * @returns {Promise<Array>} Array of existing folder paths
     */
    async _getExistingFolderStructure() {
        try {
            const existingFolders = [];

            // Get all bookmark folders from Bookmarks Bar (ID: 1)
            await this._collectFolderPaths('1', '', existingFolders);

            // Also check Other Bookmarks (ID: 2) if it has organized folders
            await this._collectFolderPaths('2', '', existingFolders);

            // Filter out default Chrome folders and empty paths
            const filteredFolders = existingFolders.filter(folder =>
                folder &&
                folder !== 'Bookmarks Bar' &&
                folder !== 'Other Bookmarks' &&
                folder !== 'Mobile Bookmarks' &&
                !folder.includes('Recently Added') &&
                folder.length > 0
            );

            console.log(`📁 Found ${filteredFolders.length} existing folders:`, filteredFolders);
            return filteredFolders;

        } catch (error) {
            console.error('Error getting existing folder structure:', error);
            return [];
        }
    }

    /**
     * Recursively collect folder paths
     * @param {string} parentId - Parent folder ID
     * @param {string} currentPath - Current path being built
     * @param {Array} folderPaths - Array to collect paths
     */
    async _collectFolderPaths(parentId, currentPath, folderPaths) {
        try {
            const children = await chrome.bookmarks.getChildren(parentId);

            for (const child of children) {
                if (!child.url) { // It's a folder
                    const folderPath = currentPath ? `${currentPath} > ${child.title}` : child.title;
                    folderPaths.push(folderPath);

                    // Recursively collect subfolders
                    await this._collectFolderPaths(child.id, folderPath, folderPaths);
                }
            }
        } catch (error) {
            console.error(`Error collecting folder paths for parent ${parentId}:`, error);
        }
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

        // Get existing folder structure to avoid duplicates
        const existingFolders = await this._getExistingFolderStructure();

        // Get user preferences for hierarchical categories
        const settings = await this._getSettings();
        const maxDepth = settings.maxCategoryDepth || 4; // Limit to 3 levels for practical organization
        const minCategories = settings.minCategories || 10; // Fewer categories for better organization
        const maxCategories = settings.maxCategories || 100; // Reduced to prevent over-categorization
        const hierarchicalMode = settings.hierarchicalMode !== false; // Default to true

        let prompt = `**Role:** Smart Hierarchical Bookmark Category Generator
**Task:** Analyze the following bookmarks and create a balanced hierarchical category system with practical, usable granularity.

**EXISTING FOLDER STRUCTURE (REUSE THESE AS MUCH AS POSSIBLE):**
${existingFolders.length > 0 ? existingFolders.map(folder => `- ${folder}`).join('\n') : '- No existing folders found'}

**CRITICAL INSTRUCTIONS:**
- **PRIORITIZE EXISTING FOLDERS:** Use the existing folder structure above whenever possible
- **AVOID DUPLICATES:** Do not create similar folders to existing ones (e.g., if "Development" exists, don't create "Programming" or "Coding")
- **EXTEND EXISTING:** Add practical subcategories to existing folders rather than creating new top-level categories
- **CONSISTENCY:** Match the naming style and hierarchy of existing folders
- **BALANCED GRANULARITY:** Create useful, practical categories that are neither too broad nor too specific

**BALANCED HIERARCHICAL REQUIREMENTS:**
- Create ${minCategories}-${maxCategories} practical hierarchical categories with 2-4 levels deep (maximum)
- Use format: "Parent > Child > Grandchild" (rarely go deeper than 3 levels)
- Examples: "Development > Frontend > JavaScript", "Business > Marketing > SEO"
- **PRACTICAL CATEGORIZATION:** Create categories that are useful for everyday bookmark organization
- **MODERATE DEPTH:** Most categories should be 2-3 levels deep, only use 4 levels for very complex domains
- **USER-FRIENDLY:** Categories should be easy to understand and navigate
- **REUSE EXISTING FOLDERS FIRST, then extend with practical subcategories based on bookmark content**

**BALANCED CATEGORIZATION RULES:**
- ✅ GOOD: "Development > Frontend > JavaScript" (practical depth)
- ✅ GOOD: "Development > Backend > APIs" (clear and useful)
- ✅ GOOD: "AI & Machine Learning > Tools" (appropriate grouping)
- ✅ GOOD: "Design > UI-UX > Resources" (practical organization)
- ✅ GOOD: "Business > Marketing > SEO" (clear hierarchy)
- ❌ TOO DEEP: "Development > Frontend > JavaScript > Frameworks > React > State Management > Redux > Middleware"
- ❌ TOO DEEP: "AI & Machine Learning > Deep Learning > Neural Networks > CNNs > Computer Vision > Object Detection"
- ❌ TOO SPECIFIC: "Tools > Productivity > Project Management > Agile > Scrum > Sprint Planning > Estimation"

**PRACTICAL ORGANIZATION PRINCIPLES:**
- Keep most categories at 2-3 levels deep for easy navigation
- Group related tools and resources together at appropriate levels
- Use clear, descriptive names that users will understand
- Avoid over-categorization that makes finding bookmarks difficult
- Focus on how users actually think about and use their bookmarks
- Create categories that will remain useful as bookmark collections grow

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

            // Use model fallback for category generation too
            const responseText = await this._generateCategoriesWithModelFallback(requestBody);

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

            throw new Error('Failed to parse generated categories from Gemini AI response');

        } catch (error) {
            console.error('Error generating categories:', error);
            throw new Error(`Failed to generate categories: ${error.message}`);
        }
    }

    /**
     * Generate categories with Gemini model fallback sequence
     * @param {Object} requestBody - Request body for Gemini API
     * @returns {Promise<string>} Response text from successful model
     */
    async _generateCategoriesWithModelFallback(requestBody) {
        let lastError = null;
        const originalModelIndex = this.currentModelIndex;

        // Try each Gemini model for category generation
        for (let attempt = 0; attempt < this.geminiModels.length; attempt++) {
            const currentModel = this.getCurrentModelName();
            const currentUrl = this.getCurrentModelUrl();

            console.log(`🏷️ Generating categories with ${currentModel} (attempt ${attempt + 1}/${this.geminiModels.length})`);

            try {
                const response = await fetch(currentUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    const data = await response.json();
                    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (responseText) {
                        console.log(`✅ Category generation SUCCESS with ${currentModel}`);
                        // Reset to original model for next operations
                        this.currentModelIndex = originalModelIndex;
                        return responseText;
                    } else {
                        throw new Error('Invalid category generation response format');
                    }
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Category generation failed with ${currentModel}:`, response.status, errorText);

                    // Check if this is a retryable error
                    const isRetryableError = response.status === 429 || // Rate limit
                        response.status === 503 || // Service unavailable
                        response.status === 500 || // Server error
                        response.status === 502 || // Bad gateway
                        response.status === 504;   // Gateway timeout

                    if (!isRetryableError) {
                        // Non-retryable errors - don't try other models
                        if (response.status === 401) {
                            throw new Error('Invalid API key for category generation. Please check your Gemini API key.');
                        } else if (response.status === 403) {
                            throw new Error('API access denied for category generation. Check your API key permissions.');
                        } else if (response.status === 400) {
                            throw new Error('Bad request for category generation. Check your API key format.');
                        } else {
                            throw new Error(`Category generation failed: ${response.status} - ${errorText}`);
                        }
                    }

                    lastError = new Error(`${currentModel}: ${response.status} - ${errorText}`);
                }

            } catch (error) {
                console.error(`❌ Category generation error with ${currentModel}:`, error.message);
                lastError = error;

                // If it's a non-retryable error, don't try other models
                if (error.message.includes('Invalid API key') ||
                    error.message.includes('API access denied') ||
                    error.message.includes('Bad request')) {
                    throw error;
                }
            }

            // Try next model if available
            if (attempt < this.geminiModels.length - 1) {
                if (!this.tryNextGeminiModel()) {
                    break;
                }
                // Small delay between model attempts
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Reset to original model
        this.currentModelIndex = originalModelIndex;

        // All models failed
        throw new Error(`Category generation failed with all Gemini models. Last error: ${lastError?.message}`);
    }





    /**
     * Process a batch of bookmarks
     * @param {Array} batch - Batch of bookmarks
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Learning data
     * @returns {Promise<Array>} Batch results
     */
    async _processBatch(batch, categories, learningData) {
        return await this._processBatchWithModelFallback(batch, categories, learningData);
    }

    /**
     * Process batch with Gemini model fallback sequence
     * @param {Array} batch - Batch of bookmarks
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Learning data
     * @returns {Promise<Array>} Batch results
     */
    async _processBatchWithModelFallback(batch, categories, learningData) {
        const prompt = await this._buildPrompt(batch, categories, learningData);
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        // Try each Gemini model in sequence
        let lastError = null;
        const originalModelIndex = this.currentModelIndex;

        for (let attempt = 0; attempt < this.geminiModels.length; attempt++) {
            const currentModel = this.getCurrentModelName();
            const currentUrl = this.getCurrentModelUrl();

            console.log(`🤖 Trying Gemini model: ${currentModel} (attempt ${attempt + 1}/${this.geminiModels.length})`);

            try {
                const response = await fetch(currentUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    },
                    body: JSON.stringify(requestBody)
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        const responseText = data.candidates[0].content.parts[0].text;
                        console.log(`✅ SUCCESS with ${currentModel}`);
                        return this._parseResponse(responseText, batch);
                    } else {
                        throw new Error('Invalid API response format');
                    }
                } else {
                    const errorText = await response.text();
                    console.error(`❌ ${currentModel} failed:`, response.status, errorText);

                    // Check if this is a retryable error (rate limit, server overload, etc.)
                    const isRetryableError = response.status === 429 || // Rate limit
                        response.status === 503 || // Service unavailable
                        response.status === 500 || // Server error
                        response.status === 502 || // Bad gateway
                        response.status === 504;   // Gateway timeout

                    if (!isRetryableError) {
                        // Non-retryable errors (auth, bad request, etc.) - don't try other models
                        if (response.status === 401) {
                            throw new Error('Invalid API key. Please check your Gemini API key in settings. Make sure it starts with "AIza" and is from Google AI Studio.');
                        } else if (response.status === 403) {
                            throw new Error('API access denied. Please check your API key permissions and ensure Gemini API is enabled.');
                        } else if (response.status === 400) {
                            throw new Error('Bad request. Please check your API key format and try again.');
                        } else {
                            throw new Error(`Gemini API request failed: ${response.status}. ${errorText}`);
                        }
                    }

                    lastError = new Error(`${currentModel}: ${response.status} - ${errorText}`);
                }

            } catch (error) {
                console.error(`❌ ${currentModel} error:`, error.message);
                lastError = error;

                // If it's a non-retryable error, don't try other models
                if (error.message.includes('Invalid API key') ||
                    error.message.includes('API access denied') ||
                    error.message.includes('Bad request')) {
                    throw error;
                }
            }

            // Try next model if available
            if (attempt < this.geminiModels.length - 1) {
                if (!this.tryNextGeminiModel()) {
                    break;
                }
                // Small delay between model attempts
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // All Gemini models failed, try AgentRouter as final fallback
        console.log('⚠️ All Gemini models failed, trying AgentRouter as final fallback...');

        // Reset to original model for next batch
        this.currentModelIndex = originalModelIndex;

        if (this.agentRouterApiKey) {
            try {
                return await this._processWithAgentRouter(batch, categories, learningData);
            } catch (agentRouterError) {
                console.error('❌ AgentRouter fallback also failed:', agentRouterError.message);
                throw new Error(`All Gemini models and AgentRouter failed. Last Gemini error: ${lastError?.message}. AgentRouter: ${agentRouterError.message}`);
            }
        } else {
            throw new Error(`All Gemini models failed. Last error: ${lastError?.message}. No AgentRouter key configured.`);
        }
    }

    /**
     * Build prompt for Gemini API
     * @param {Array} bookmarks - Bookmarks to categorize
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Learning data
     * @returns {string} Formatted prompt
     */
    async _buildPrompt(bookmarks, categories, learningData) {
        // Get existing folder structure to include in prompt
        const existingFolders = await this._getExistingFolderStructure();

        let prompt = `**Role:** Smart Bookmark Categorization and Title Optimization Expert
**Task:** Analyze the following bookmarks and assign each to the most appropriate practical category, and generate clear, descriptive titles.

**EXISTING FOLDER STRUCTURE (PRIORITIZE THESE):**
${existingFolders.length > 0 ? existingFolders.map(folder => `- ${folder}`).join('\n') : '- No existing folders found'}

**Available Categories:** ${categories.join(', ')}

**PRACTICAL CATEGORIZATION INSTRUCTIONS:**
- **BALANCED SPECIFICITY:** Use categories that are specific enough to be useful but not so deep they're hard to navigate
- **CLEAR ORGANIZATION:** Choose categories that make sense for everyday bookmark management
- **CONTEXTUAL ANALYSIS:** Analyze URL domain, title, and content type for appropriate categorization
- **PRACTICAL DEPTH:** Use 2-3 levels of hierarchy for most content, only go deeper when truly necessary
- **USER-FRIENDLY:** Choose categories that users will easily understand and remember
- **AVOID OVER-CATEGORIZATION:** Don't use overly specific categories when broader ones work better

**GOOD CATEGORIZATION EXAMPLES:**
- ✅ GOOD: "Development > Frontend > JavaScript" (clear and practical)
- ✅ GOOD: "AI & Machine Learning > Tools" (appropriately grouped)
- ✅ GOOD: "Design > UI-UX > Resources" (useful organization)
- ✅ GOOD: "Business > Marketing > SEO" (clear hierarchy)
- ✅ GOOD: "Learning > Programming > Python" (practical depth)
- ✅ GOOD: "Tools > Productivity > Project Management" (balanced specificity)
- ❌ TOO DEEP: "Development > Frontend > JavaScript > Frameworks > React > State Management > Redux"
- ❌ TOO DEEP: "AI & Machine Learning > Deep Learning > Neural Networks > CNNs > Computer Vision"

**PRACTICAL CATEGORIZATION RULES:**
- Use 2-3 levels of hierarchy for most bookmarks
- Only use 4+ levels for very complex technical content when absolutely necessary
- Analyze the bookmark's primary purpose and categorize accordingly
- Consider how users will actually search for and use these bookmarks
- Group similar tools and resources together at appropriate levels
- Choose the most practical category that accurately represents the content

**TITLE GENERATION INSTRUCTIONS:**
- **GENERATE IMPROVED TITLES:** Create descriptive, clear titles for each bookmark
- **INCLUDE CONTEXT:** Add relevant context from URL domain and page content
- **BE DESCRIPTIVE:** Make titles self-explanatory and informative
- **MAINTAIN BREVITY:** Keep titles concise but descriptive (50-80 characters ideal)
- **ADD VALUE:** Include key information that helps identify the bookmark's purpose
- **EXAMPLES:**
  - Original: "GitHub" → Improved: "GitHub - Code Repository Platform"
  - Original: "Docs" → Improved: "React Documentation - JavaScript Library Guide"
  - Original: "Home" → Improved: "Netflix - Streaming Movies & TV Shows"
  - Original: "Dashboard" → Improved: "AWS Console - Cloud Services Dashboard"

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

        prompt += `\n\n**OUTPUT REQUIREMENTS:**
- Return JSON array with same number of items as input bookmarks
- Each item must have 'id' (bookmark position 1-${bookmarks.length}), 'category' (full hierarchical path), 'title' (improved descriptive title), and 'confidence' (0.0-1.0)
- Use categories from the available list above
- Category must be the full path (e.g., "Work > Development > Frontend")
- Title must be descriptive and informative, based on URL domain and content context
- Choose the most appropriate category level - not too broad, not too specific
- If uncertain about the specific subcategory, use a broader category from the list
- Consider URL domain, title content, and current folder location for accurate categorization
- Prefer practical, usable categories that make sense for bookmark organization

**EXAMPLE OUTPUT:**
[
  {"id": 1, "category": "Work > Development > Frontend", "title": "React Documentation - JavaScript Library Guide", "confidence": 0.9},
  {"id": 2, "category": "Learning > Programming > Python", "title": "Pandas Tutorial - Data Analysis with Python", "confidence": 0.8},
  {"id": 3, "category": "Personal > Finance > Investment", "title": "Yahoo Finance - Stock Market Data & Analysis", "confidence": 0.7}
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

            // Map results to bookmark IDs and include titles
            return parsed.map((result, index) => ({
                id: result.id || (index + 1),
                bookmarkId: batch[index]?.id,
                category: result.category || 'Other',
                title: result.title || batch[index]?.title || 'Untitled',
                confidence: result.confidence || 0.5
            }));

        } catch (error) {
            console.error('Error parsing API response:', error);
            console.log('Raw response:', responseText);
            throw new Error(`Failed to parse AI response: ${error.message}`);
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
     * Process batch using AgentRouter as fallback
     * @param {Array} batch - Batch of bookmarks
     * @param {Array} categories - Available categories
     * @param {Object} learningData - Learning data
     * @returns {Promise<Array>} Batch results
     */
    async _processWithAgentRouter(batch, categories, learningData) {
        console.log('🌐 Using AgentRouter fallback API...');

        const prompt = await this._buildPrompt(batch, categories, learningData);

        const requestBody = {
            model: this.fallbackModel,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 4000
        };

        try {
            const response = await fetch(this.agentRouterBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.agentRouterApiKey}`,
                    'HTTP-Referer': 'https://bookmarkmind.extension',
                    'X-Title': 'BookmarkMind Extension'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AgentRouter API Error:', response.status, errorText);
                throw new Error(`AgentRouter API request failed: ${response.status}. ${errorText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid AgentRouter API response format');
            }

            const responseText = data.choices[0].message.content;
            console.log('✅ AgentRouter fallback successful');
            return this._parseResponse(responseText, batch);

        } catch (error) {
            console.error('AgentRouter fallback failed:', error);
            throw new Error(`AgentRouter API failed: ${error.message}`);
        }
    }

    /**
     * Get user settings
     * @returns {Promise<Object>} User settings
     */
    async _getSettings() {
        const defaultSettings = {
            hierarchicalMode: true,
            maxCategoryDepth: 3, // Limit to 3 levels for practical organization
            minCategories: 10, // Fewer categories for better organization
            maxCategories: 30, // Reduced to prevent over-categorization
            batchSize: 50 // Default batch size
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
