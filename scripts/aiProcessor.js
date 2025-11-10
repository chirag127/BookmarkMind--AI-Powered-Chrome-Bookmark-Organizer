/**
 * BookmarkMind - AI Processor
 * Handles Gemini API integration for bookmark categorization
 */

class AIProcessor {
    constructor() {
        this.apiKey = null;
        this.bookmarkService = null;
        this.analyticsService = typeof AnalyticsService !== 'undefined' ? new AnalyticsService() : null;

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
     * Normalize folder name with proper capitalization and formatting
     * Only changes folders that clearly need improvement
     * @param {string} folderName - Original folder name
     * @returns {string} Normalized folder name
     */
    normalizeFolderName(folderName) {
        if (!folderName || typeof folderName !== 'string') {
            return folderName;
        }

        const original = folderName.trim();

        // Don't change if it's already well-formatted
        if (this._isWellFormatted(original)) {
            return original;
        }

        // Apply normalization rules
        let normalized = original;

        // Fix common capitalization issues
        normalized = this._fixCapitalization(normalized);

        // Clean up spacing and punctuation
        normalized = this._cleanupSpacing(normalized);

        // Fix common abbreviations and technical terms
        normalized = this._fixCommonTerms(normalized);

        // Only return the normalized version if it's significantly better
        if (this._isSignificantImprovement(original, normalized)) {
            console.log(`📁 Normalized folder: "${original}" → "${normalized}"`);
            return normalized;
        }

        return original;
    }

    /**
     * Check if a folder name is already well-formatted
     * @param {string} name - Folder name to check
     * @returns {boolean} True if well-formatted
     */
    _isWellFormatted(name) {
        // Skip very short names
        if (name.length <= 2) return true;

        // Skip if it's intentionally all caps (like "AI", "API", "UI")
        if (name.length <= 4 && name === name.toUpperCase()) return true;

        // Skip if it's a proper noun or brand name that's already correct
        if (this._isProperNoun(name)) return true;

        // Check for obvious formatting issues that need fixing
        const hasIssues = [
            name === name.toLowerCase() && name.length > 2,  // all lowercase
            name === name.toUpperCase() && name.length > 4,  // all uppercase
            /\s{2,}/.test(name),                             // multiple spaces
            /^\s|\s$/.test(name),                            // leading/trailing spaces
            this._isCamelCase(name),                         // camelCase
            /\bjavascript\b/i.test(name) && !/JavaScript/.test(name), // common tech terms
            /\bgithub\b/i.test(name) && !/GitHub/.test(name),
            /\bapi\b/i.test(name) && !/API/.test(name),
            /\bui\b/i.test(name) && !/UI/.test(name),
            /\bios\b/i.test(name) && !/iOS/.test(name)
        ];

        // If it has obvious issues, it's not well-formatted
        if (hasIssues.some(Boolean)) {
            return false;
        }

        // Check if it's already in good title case with proper technical terms
        const titleCase = this._toTitleCase(name);
        const withTechTerms = this._fixCommonTerms(titleCase);

        // It's well-formatted if it matches the expected result
        return name === withTechTerms;
    }

    /**
     * Fix capitalization issues
     * @param {string} name - Folder name
     * @returns {string} Fixed name
     */
    _fixCapitalization(name) {
        // Handle all lowercase
        if (name === name.toLowerCase() && name.length > 2) {
            return this._toTitleCase(name);
        }

        // Handle all uppercase (except short acronyms)
        if (name === name.toUpperCase() && name.length > 4) {
            return this._toTitleCase(name);
        }

        // Handle camelCase or PascalCase that should be title case
        if (this._isCamelCase(name)) {
            return this._camelToTitleCase(name);
        }

        return name;
    }

    /**
     * Clean up spacing and punctuation
     * @param {string} name - Folder name
     * @returns {string} Cleaned name
     */
    _cleanupSpacing(name) {
        return name
            .replace(/\s+/g, ' ')           // Multiple spaces to single space
            .replace(/\s*-\s*/g, ' - ')     // Fix spacing around dashes
            .replace(/\s*&\s*/g, ' & ')     // Fix spacing around ampersands
            .replace(/\s*\+\s*/g, ' + ')    // Fix spacing around plus signs
            .replace(/^\s+|\s+$/g, '')      // Trim whitespace
            .replace(/^-+|-+$/g, '')        // Remove leading/trailing dashes
            .trim();
    }

    /**
     * Fix common technical terms and abbreviations
     * @param {string} name - Folder name
     * @returns {string} Fixed name
     */
    _fixCommonTerms(name) {
        const fixes = {
            // Technical terms
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'nodejs': 'Node.js',
            'reactjs': 'React.js',
            'vuejs': 'Vue.js',
            'angularjs': 'Angular.js',
            'jquery': 'jQuery',
            'github': 'GitHub',
            'gitlab': 'GitLab',
            'stackoverflow': 'Stack Overflow',
            'youtube': 'YouTube',
            'linkedin': 'LinkedIn',
            'facebook': 'Facebook',
            'instagram': 'Instagram',
            'twitter': 'Twitter',
            'tiktok': 'TikTok',
            'whatsapp': 'WhatsApp',
            'wordpress': 'WordPress',
            'shopify': 'Shopify',
            'amazon': 'Amazon',
            'netflix': 'Netflix',
            'spotify': 'Spotify',
            'paypal': 'PayPal',
            'dropbox': 'Dropbox',
            'onedrive': 'OneDrive',
            'googledrive': 'Google Drive',
            'icloud': 'iCloud',

            // Common abbreviations that should stay uppercase
            'ai': 'AI',
            'api': 'API',
            'ui': 'UI',
            'ux': 'UX',
            'seo': 'SEO',
            'css': 'CSS',
            'html': 'HTML',
            'xml': 'XML',
            'json': 'JSON',
            'sql': 'SQL',
            'php': 'PHP',
            'ios': 'iOS',
            'android': 'Android',
            'windows': 'Windows',
            'macos': 'macOS',
            'linux': 'Linux',
            'ubuntu': 'Ubuntu',

            // Business terms
            'ecommerce': 'E-commerce',
            'b2b': 'B2B',
            'b2c': 'B2C',
            'saas': 'SaaS',
            'crm': 'CRM',
            'erp': 'ERP',
            'hr': 'HR',
            'it': 'IT',
            'r&d': 'R&D',
            'roi': 'ROI',
            'kpi': 'KPI'
        };

        let result = name;

        // Apply word-boundary fixes
        for (const [wrong, correct] of Object.entries(fixes)) {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            result = result.replace(regex, correct);
        }

        return result;
    }

    /**
     * Convert to title case
     * @param {string} str - String to convert
     * @returns {string} Title case string
     */
    _toTitleCase(str) {
        const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];

        return str.toLowerCase().split(' ').map((word, index) => {
            // Always capitalize first and last word
            if (index === 0 || index === str.split(' ').length - 1) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }

            // Don't capitalize small words unless they're first/last
            if (smallWords.includes(word)) {
                return word;
            }

            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

    /**
     * Check if string has intentional mixed case
     * @param {string} str - String to check
     * @returns {boolean} True if has intentional mixed case
     */
    _hasIntentionalMixedCase(str) {
        const intentionalPatterns = [
            /^[A-Z][a-z]+[A-Z]/,  // PascalCase like "JavaScript"
            /^i[A-Z]/,             // Apple style like "iPhone", "iPad"
            /^e[A-Z]/,             // e-style like "eBay", "eCommerce"
            /[A-Z]{2,}/,           // Contains acronyms like "HTML5"
        ];

        return intentionalPatterns.some(pattern => pattern.test(str));
    }

    /**
     * Check if string is camelCase
     * @param {string} str - String to check
     * @returns {boolean} True if camelCase
     */
    _isCamelCase(str) {
        return /^[a-z]+[A-Z]/.test(str) && !str.includes(' ');
    }

    /**
     * Convert camelCase to Title Case
     * @param {string} str - camelCase string
     * @returns {string} Title Case string
     */
    _camelToTitleCase(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Check if string is a proper noun that shouldn't be changed
     * @param {string} str - String to check
     * @returns {boolean} True if proper noun
     */
    _isProperNoun(str) {
        const properNouns = [
            'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Meta',
            'Netflix', 'Spotify', 'Adobe', 'Oracle', 'IBM', 'Intel',
            'Samsung', 'Sony', 'Nintendo', 'Tesla', 'Uber', 'Airbnb',
            'PayPal', 'eBay', 'Etsy', 'Pinterest', 'Reddit', 'Discord',
            'Slack', 'Zoom', 'Skype', 'WhatsApp', 'Telegram', 'Signal'
        ];

        return properNouns.includes(str);
    }

    /**
     * Check if normalized version is a significant improvement
     * @param {string} original - Original name
     * @param {string} normalized - Normalized name
     * @returns {boolean} True if significant improvement
     */
    _isSignificantImprovement(original, normalized) {
        // Don't change if they're the same
        if (original === normalized) return false;

        // Don't change if only minor differences
        if (original.toLowerCase() === normalized.toLowerCase() &&
            Math.abs(original.length - normalized.length) <= 2) {
            return false;
        }

        // Consider it an improvement if:
        // - Fixed obvious casing issues
        // - Cleaned up spacing
        // - Fixed common technical terms

        const improvements = [
            // Fixed all lowercase
            original === original.toLowerCase() && original.length > 2,
            // Fixed all uppercase
            original === original.toUpperCase() && original.length > 4,
            // Fixed spacing issues
            /\s{2,}/.test(original) || /^\s|\s$/.test(original),
            // Fixed common terms
            /\bjavascript\b/i.test(original) || /\bgithub\b/i.test(original) || /\bapi\b/i.test(original)
        ];

        return improvements.some(Boolean);
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

        // Reset to first Gemini model at the start of each categorization session
        this.resetToFirstModel();

        // Notify background script that AI categorization is starting
        try {
            await chrome.runtime.sendMessage({ action: 'startAICategorization' });
            console.log('🤖 Notified background: AI categorization started');
        } catch (error) {
            console.warn('Failed to notify background of AI categorization start:', error);
        }

        try {

            // Normalize existing folder names for better presentation
            await this._normalizeExistingFolders();

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

                                    // Mark this bookmark as moved by AI BEFORE moving it to prevent learning
                                    try {
                                        await chrome.runtime.sendMessage({
                                            action: 'markBookmarkAsAIMoved',
                                            bookmarkId: bookmark.id
                                        });
                                        console.log(`🤖 Pre-marked bookmark ${bookmark.id} as AI-moved before inline move`);
                                    } catch (error) {
                                        console.warn('Failed to mark bookmark as AI-moved:', error);
                                    }

                                    // Small delay to ensure the message is processed
                                    await new Promise(resolve => setTimeout(resolve, 100));

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

            // Notify background script that AI categorization is ending
            try {
                await chrome.runtime.sendMessage({ action: 'endAICategorization' });
                console.log('🤖 Notified background: AI categorization ended');
            } catch (error) {
                console.warn('Failed to notify background of AI categorization end:', error);
            }

            return {
                categories: dynamicCategories,
                results: results
            };

        } catch (error) {
            // Ensure AI state is reset even if categorization fails
            try {
                await chrome.runtime.sendMessage({ action: 'endAICategorization' });
                console.log('🤖 Notified background: AI categorization ended (due to error)');
            } catch (notifyError) {
                console.warn('Failed to notify background of AI categorization end after error:', notifyError);
            }

            // Re-throw the original error
            throw error;
        }
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

        // Mark this bookmark as moved by AI BEFORE moving it to prevent learning
        try {
            await chrome.runtime.sendMessage({
                action: 'markBookmarkAsAIMoved',
                bookmarkId: bookmark.id
            });
            console.log(`🤖 Pre-marked bookmark ${bookmark.id} as AI-moved before direct move`);
        } catch (error) {
            console.warn('Failed to mark bookmark as AI-moved:', error);
        }

        // Small delay to ensure the message is processed
        await new Promise(resolve => setTimeout(resolve, 100));

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
        // All bookmarks must be categorized into specific functional categories
        if (!categoryPath || categoryPath.trim() === '') {
            throw new Error('Category path cannot be empty - all bookmarks must be properly categorized');
        }

        const parts = categoryPath.split(' > ').map(part => part.trim());
        let currentParentId = rootFolderId;

        console.log(`📁 Creating folder structure for: "${categoryPath}"`);

        for (const part of parts) {
            // Normalize the folder name for better presentation
            const normalizedPart = this.normalizeFolderName(part);

            // Check if folder already exists (check both original and normalized names)
            const children = await chrome.bookmarks.getChildren(currentParentId);
            let existingFolder = children.find(child => !child.url &&
                (child.title === part || child.title === normalizedPart));

            if (!existingFolder) {
                // Create the folder with normalized name
                existingFolder = await chrome.bookmarks.create({
                    parentId: currentParentId,
                    title: normalizedPart
                });
                console.log(`📁 Created folder: "${normalizedPart}" in parent ${currentParentId}`);
            } else {
                // If existing folder has poor formatting, update it to normalized version
                if (existingFolder.title !== normalizedPart &&
                    this._isSignificantImprovement(existingFolder.title, normalizedPart)) {

                    await chrome.bookmarks.update(existingFolder.id, { title: normalizedPart });
                    console.log(`📁 Updated folder name: "${existingFolder.title}" → "${normalizedPart}"`);
                } else {
                    console.log(`📁 Using existing folder: "${existingFolder.title}" (ID: ${existingFolder.id})`);
                }
            }

            currentParentId = existingFolder.id;
        }

        return currentParentId;
    }

    /**
     * Extract keywords from URL and title for better categorization
     * @param {string} url - Bookmark URL
     * @param {string} title - Bookmark title
     * @returns {Array} Array of relevant keywords
     */
    _extractUrlKeywords(url, title) {
        const keywords = [];

        try {
            if (url) {
                const urlObj = new URL(url);
                const domain = urlObj.hostname.toLowerCase();
                const path = urlObj.pathname.toLowerCase();
                const search = urlObj.search.toLowerCase();

                // Extract domain keywords
                const domainParts = domain.split('.');
                keywords.push(...domainParts.filter(part => part.length > 2));

                // Extract path keywords
                const pathParts = path.split('/').filter(part => part.length > 2);
                keywords.push(...pathParts);

                // Extract search parameters
                if (search) {
                    const searchParts = search.match(/[a-zA-Z]{3,}/g) || [];
                    keywords.push(...searchParts);
                }
            }

            if (title) {
                const titleWords = title.toLowerCase().match(/[a-zA-Z]{3,}/g) || [];
                keywords.push(...titleWords);
            }

        } catch (error) {
            console.warn('Error extracting keywords:', error);
        }

        // Remove duplicates and common words
        const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];

        return [...new Set(keywords)]
            .filter(keyword => !commonWords.includes(keyword))
            .slice(0, 10); // Limit to top 10 keywords
    }

    /**
     * Detect content type from URL and title
     * @param {string} url - Bookmark URL
     * @param {string} title - Bookmark title
     * @returns {string} Detected content type
     */
    _detectContentType(url, title) {
        const combined = `${url} ${title}`.toLowerCase();

        // Video content
        if (/youtube|vimeo|twitch|netflix|video|stream|movie|tv|series/.test(combined)) {
            return 'Video/Streaming';
        }

        // Social media
        if (/facebook|twitter|instagram|linkedin|reddit|discord|telegram|whatsapp/.test(combined)) {
            return 'Social Media';
        }

        // Development/Tech
        if (/github|gitlab|stackoverflow|dev|code|programming|api|documentation|docs/.test(combined)) {
            return 'Development/Tech';
        }

        // Shopping/E-commerce
        if (/amazon|shop|buy|cart|store|price|product|deal|sale/.test(combined)) {
            return 'Shopping/E-commerce';
        }

        // News/Media
        if (/news|article|blog|medium|press|journalist|report/.test(combined)) {
            return 'News/Media';
        }

        // Education/Learning
        if (/course|tutorial|learn|education|university|school|training|study/.test(combined)) {
            return 'Education/Learning';
        }

        // Finance
        if (/bank|finance|money|investment|crypto|trading|stock|payment/.test(combined)) {
            return 'Finance';
        }

        // Tools/Utilities
        if (/tool|utility|app|software|service|platform|dashboard/.test(combined)) {
            return 'Tools/Utilities';
        }

        return 'Tools > Utilities';
    }

    /**
     * Detect risk flags that might indicate inappropriate categorization
     * @param {string} url - Bookmark URL
     * @param {string} title - Bookmark title
     * @returns {Array} Array of risk flags
     */
    _detectRiskFlags(url, title) {
        const flags = [];
        const combined = `${url} ${title}`.toLowerCase();

        // Torrent/P2P related
        if (/torrent|magnet|pirate|p2p|bittorrent|utorrent|tracker|seed|leech/.test(combined)) {
            flags.push('TORRENT/P2P');
        }

        // Paywall bypass related
        if (/bypass|paywall|free|crack|hack|unlock|premium|subscription/.test(combined)) {
            flags.push('PAYWALL_BYPASS');
        }

        // Adult content
        if (/adult|xxx|porn|nsfw|18\+/.test(combined)) {
            flags.push('ADULT_CONTENT');
        }

        // Gambling
        if (/casino|gambling|bet|poker|lottery|slots/.test(combined)) {
            flags.push('GAMBLING');
        }

        // Suspicious/Malware
        if (/malware|virus|suspicious|phishing|scam/.test(combined)) {
            flags.push('SUSPICIOUS');
        }

        return flags;
    }

    /**
     * Normalize existing folder names for better presentation
     * Only updates folders that clearly need improvement
     */
    async _normalizeExistingFolders() {
        try {
            console.log('📁 Checking existing folders for normalization...');

            // Get all bookmark folders from main locations
            const foldersToCheck = ['1', '2']; // Bookmarks Bar and Other Bookmarks
            let normalizedCount = 0;

            for (const rootId of foldersToCheck) {
                normalizedCount += await this._normalizeFoldersRecursively(rootId);
            }

            if (normalizedCount > 0) {
                console.log(`📁 Normalized ${normalizedCount} folder names for better presentation`);
            } else {
                console.log('📁 All existing folders are already well-formatted');
            }

        } catch (error) {
            console.error('Error normalizing existing folders:', error);
            // Don't throw - this is not critical for the main functionality
        }
    }

    /**
     * Recursively normalize folders in a tree
     * @param {string} parentId - Parent folder ID
     * @returns {Promise<number>} Number of folders normalized
     */
    async _normalizeFoldersRecursively(parentId) {
        let normalizedCount = 0;

        try {
            const children = await chrome.bookmarks.getChildren(parentId);

            for (const child of children) {
                if (!child.url) { // It's a folder
                    const normalizedName = this.normalizeFolderName(child.title);

                    // Update if it's a significant improvement
                    if (child.title !== normalizedName &&
                        this._isSignificantImprovement(child.title, normalizedName)) {

                        await chrome.bookmarks.update(child.id, { title: normalizedName });
                        console.log(`📁 Normalized: "${child.title}" → "${normalizedName}"`);
                        normalizedCount++;
                    }

                    // Recursively check subfolders
                    normalizedCount += await this._normalizeFoldersRecursively(child.id);
                }
            }
        } catch (error) {
            console.error(`Error normalizing folders in parent ${parentId}:`, error);
        }

        return normalizedCount;
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
     * Generate dynamic functional categories based on bookmark analysis (FMHY-style)
     * @param {Array} bookmarks - All bookmarks to analyze
     * @param {Array} suggestedCategories - Optional suggested categories
     * @param {Object} learningData - Learning data
     * @returns {Promise<Array>} Generated functional categories
     */
    async _generateDynamicCategories(bookmarks, suggestedCategories = [], learningData = {}) {
        // Take a sample of bookmarks for category generation (max 150 for better analysis)
        const sampleBookmarks = bookmarks.slice(0, Math.min(150, bookmarks.length));

        // Get existing folder structure to avoid duplicates
        const existingFolders = await this._getExistingFolderStructure();

        // Get user preferences for functional categories
        const settings = await this._getSettings();
        const maxDepth = settings.maxCategoryDepth || 3; // Allow 2-3 levels for functional organization (FMHY-style)
        const functionalMode = settings.functionalMode !== false; // Default to true (FMHY-style)
        // NO LIMITS on number of categories - generate as many as needed for proper organization

        let prompt = `**Role:** Smart Functional Bookmark Category Generator (FMHY-Style)
**Task:** Analyze the following bookmarks and create a balanced functional category system organized by what services DO, not who provides them.

**EXISTING FOLDER STRUCTURE (REUSE THESE AS MUCH AS POSSIBLE):**
${existingFolders.length > 0 ? existingFolders.map(folder => `- ${folder}`).join('\n') : '- No existing folders found'}

**CRITICAL INSTRUCTIONS:**
- **PRIORITIZE EXISTING FOLDERS:** Use the existing folder structure above whenever possible
- **AVOID DUPLICATES:** Do not create similar folders to existing ones (e.g., if "Development" exists, don't create "Programming" or "Coding")
- **EXTEND EXISTING:** Add practical subcategories to existing folders rather than creating new top-level categories
- **CONSISTENCY:** Match the naming style and hierarchy of existing folders
- **BALANCED GRANULARITY:** Create useful, practical categories that are neither too hierarchical nor too specific

**FUNCTIONAL CATEGORIZATION REQUIREMENTS (FMHY-Style):**
- Create AS MANY FUNCTIONAL categories as needed with MAXIMUM 2-3 levels deep
- NO LIMITS on number of categories - generate comprehensive functional organization
- Use format: "Category > Subcategory" or "Category > Subcategory > Type" (based on FMHY structure)
- Examples: "Tools > File Tools > Cloud Storage", "Adblocking / Privacy > VPN", "Education > Privacy Guides"
- **FUNCTIONAL ORGANIZATION:** Group services by WHAT THEY DO, not who provides them
- **PRACTICAL DEPTH:** Categories should be 2-3 levels deep for proper organization
- **SERVICE-AGNOSTIC:** Categories should contain ALL services that perform the same function
- **COMPREHENSIVE COVERAGE:** Create specific categories for every type of service/content found
- **REUSE EXISTING FOLDERS FIRST, but organize them functionally**

**FUNCTIONAL CATEGORIZATION RULES (FMHY-Style):**
- ✅ GOOD: "Tools > File Tools > Cloud Storage" (functional grouping of all cloud storage services)
- ✅ GOOD: "Adblocking / Privacy > VPN" (functional grouping of all VPN services)
- ✅ GOOD: "Adblocking / Privacy > Encrypted Messengers" (functional grouping of secure messaging)
- ✅ GOOD: "Web Privacy > Search Engines" (functional grouping of privacy-focused search)
- ✅ GOOD: "Education > Privacy Guides" (functional grouping of educational content)
- ❌ WRONG: "Google > Drive" (organized by company, not function)
- ❌ WRONG: "Microsoft > OneDrive" (organized by provider, not what it does)
- ❌ WRONG: "Popular Tools" (catch-all category, not functional)

**FUNCTIONAL ORGANIZATION PRINCIPLES (FMHY-Style):**
- Keep categories at 2-3 levels maximum for proper functional organization
- Group services by FUNCTION, not by provider or brand name
- Use descriptive names that explain what the services DO
- Organize by purpose: "Tools > File Tools > Cloud Storage" contains ALL cloud storage services
- Focus on functional categories that group similar services together
- Create categories that accommodate multiple service providers doing the same thing

**FOLDER NAME FORMATTING REQUIREMENTS:**
- **PROPER CAPITALIZATION:** Use proper Title Case for all category names
- **TECHNICAL TERMS:** Capitalize technical terms correctly (JavaScript, GitHub, API, UI, UX, iOS, etc.)
- **BRAND NAMES:** Use correct brand capitalization (GitHub, YouTube, LinkedIn, PayPal, etc.)
- **ACRONYMS:** Keep acronyms uppercase (AI, API, UI, UX, SEO, CSS, HTML, JSON, etc.)
- **CONSISTENT SPACING:** Use single spaces, proper spacing around separators
- **PROFESSIONAL APPEARANCE:** Categories should look polished and professional

**FORMATTING EXAMPLES (FMHY-Style):**
- ✅ CORRECT: "Adblocking / Privacy > VPN"
- ✅ CORRECT: "Tools > File Tools > Cloud Storage"
- ✅ CORRECT: "Adblocking / Privacy > Password Privacy / 2FA"
- ✅ CORRECT: "Web Privacy > Search Engines"
- ✅ CORRECT: "Education > Privacy Guides"
- ❌ WRONG: "adblocking / privacy > vpn"
- ❌ WRONG: "tools > file tools > cloud storage"
- ❌ WRONG: "web privacy>search engines"
- ❌ WRONG: "education>privacy guides"

**TECHNICAL TERM CAPITALIZATION GUIDE (FMHY-Style):**
- Privacy/Security: VPN, DNS, 2FA, Anti-Malware, URL, SSL, TLS
- Programming: JavaScript, TypeScript, Node.js, React.js, Vue.js, Angular.js, API, REST, GraphQL
- Platforms: GitHub, GitLab, Stack Overflow, YouTube, LinkedIn, Facebook, Google Drive, OneDrive
- Cloud Storage: MEGA, pCloud, Dropbox, iCloud, Google Drive, OneDrive
- Technologies: JSON, XML, CSS, HTML, SQL, NoSQL, VM, VirtualBox, VMware
- Mobile: iOS, Android, React Native, Flutter
- Cloud: AWS, Azure, Google Cloud, Docker, Kubernetes
- Business: B2B, B2C, SaaS, CRM, ERP, SEO, ROI, KPI
- Design: UI, UX, Figma, Adobe, Photoshop

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

        prompt += `\n\n**FUNCTIONAL HIERARCHICAL CATEGORY INSTRUCTIONS:**
- Analyze bookmark titles, domains, current folders, and content patterns
- Create FUNCTIONAL hierarchical categories with MAXIMUM ${maxDepth} levels using " > " separator
- Generate AS MANY category trees as needed based on FUNCTION, not service names (NO LIMITS)
- Create comprehensive functional organization - don't limit the number of categories
- Organize by WHAT THE TOOL DOES, not WHO PROVIDES IT
- Categories should be:
  * Functional and practical (e.g., "Tools > File Tools > Cloud Storage" contains Google Drive, Dropbox, OneDrive)
  * Organized by PURPOSE and FUNCTION, not by service provider
  * Based on actual bookmark functionality but kept simple
  * Include functional categories that group services by what they do

**FUNCTIONAL HIERARCHICAL CATEGORY EXAMPLES (UNLIMITED CATEGORIES - CREATE AS MANY AS NEEDED):**

**PRIVACY & SECURITY (Create specific subcategories):**
- "Adblocking / Privacy > VPN" (ProtonVPN, Mullvad, AirVPN, Windscribe, RiseupVPN)
- "Adblocking / Privacy > Encrypted Messengers" (Signal, SimpleX, Matrix, Wire)
- "Adblocking / Privacy > Password Privacy / 2FA" (2FA Directory, Ente Auth, Aegis, 2FAS, KeePassXC)
- "Adblocking / Privacy > Antivirus / Anti-Malware" (Malwarebytes, ESET, AdwCleaner)
- "Adblocking / Privacy > DNS Adblocking" (LibreDNS, NextDNS, DNSWarden, AdGuard DNS, Pi-Hole)
- "Web Privacy > Search Engines" (DuckDuckGo, Brave Search, Startpage, Mojeek, Searx)

**TOOLS & UTILITIES (Create specific subcategories for each tool type):**
- "Tools > File Tools > Cloud Storage" (Google Drive, Dropbox, OneDrive, MEGA, pCloud)
- "Tools > File Tools > Converters" (File format converters, compressors)
- "Tools > File Tools > Sharing" (WeTransfer, file hosting services)
- "Tools > System Tools > Virtual Machines" (VMware, VirtualBox, QEMU)
- "Tools > Image Tools > Editors" (Image editing tools)
- "Tools > Video Tools > Editors" (Video editing tools)
- "Tools > Audio Tools > Editors" (Audio editing tools)
- "Tools > Text Tools > Editors" (Text and markdown editors)
- "Tools > Utilities" (General calculators, converters, misc utilities)

**DEVELOPMENT (Create specific subcategories for each dev area):**
- "Development > Code Repositories" (GitHub, GitLab, Bitbucket, SourceForge)
- "Development > Documentation" (MDN, Stack Overflow, DevDocs, API references)
- "Development > Tools > IDEs" (VS Code, IntelliJ, online IDEs)
- "Development > Tools > Frameworks" (React, Angular, Vue documentation)
- "Development > Tools > Testing" (Testing frameworks, tools)
- "Development > Tools > Deployment" (Hosting, CI/CD platforms)

**EDUCATION (Create specific subcategories for each learning type):**
- "Education > Learning Platforms" (Coursera, Udemy, Khan Academy, edX)
- "Education > Programming Tutorials" (Coding bootcamps, programming courses)
- "Education > Language Learning" (Duolingo, language platforms)
- "Education > Academic Resources" (Research, academic databases)
- "Education > Privacy Guides" (Privacy Guides, security education)

**ENTERTAINMENT (Create specific subcategories for each entertainment type):**
- "Entertainment > Streaming > Video" (Netflix, YouTube, Twitch, Disney+)
- "Entertainment > Streaming > Music" (Spotify, Apple Music, SoundCloud)
- "Entertainment > Gaming > Platforms" (Steam, Epic Games, gaming stores)
- "Entertainment > Gaming > Resources" (Gaming news, guides, communities)
- "Entertainment > Books > Reading" (Goodreads, online libraries, ebooks)
- "Entertainment > Podcasts" (Podcast platforms and directories)

**BUSINESS (Create specific subcategories for each business function):**
- "Business > Productivity > Project Management" (Slack, Trello, Asana, Notion)
- "Business > Productivity > Communication" (Zoom, Teams, communication tools)
- "Business > Finance > Banking" (Online banking, financial services)
- "Business > Finance > Investment" (Trading platforms, investment tools)
- "Business > Finance > Cryptocurrency" (Crypto exchanges, blockchain tools)
- "Business > Marketing > SEO" (SEO tools, analytics platforms)

**SHOPPING (Create specific subcategories for each shopping type):**
- "Shopping > E-commerce > General" (Amazon, eBay, general marketplaces)
- "Shopping > E-commerce > Specialized" (Etsy, niche marketplaces)
- "Shopping > Price Comparison" (Price tracking, deal aggregators)
- "Shopping > Coupons & Deals" (Coupon sites, deal platforms)

**NEWS & MEDIA (Create specific subcategories for each news type):**
- "News > Technology News" (TechCrunch, Ars Technica, The Verge, Hacker News)
- "News > General News" (BBC, CNN, Reuters, Associated Press)
- "News > Industry Specific" (Industry publications, trade news)
- "News > Blogs & Opinion" (Personal blogs, opinion sites)

**SOCIAL & COMMUNICATION (Create specific subcategories):**
- "Social Media > Platforms" (Twitter, Facebook, Instagram, LinkedIn)
- "Social Media > Professional" (LinkedIn, professional networks)
- "Social Media > Communities" (Reddit, Discord, forums)

**IMPORTANT: CREATE AS MANY SPECIFIC CATEGORIES AS NEEDED!**
- Analyze ALL bookmarks and create specific functional categories for every type of service
- Don't limit yourself to these examples - create new categories as needed
- Be comprehensive and specific - users prefer detailed organization
- Group services by their actual function, not by popularity or provider

**OUTPUT FORMAT:**
Return a JSON array of FUNCTIONAL hierarchical category paths with proper capitalization.
CREATE AS MANY CATEGORIES AS NEEDED - NO LIMITS! Example structure:
[
  "Adblocking / Privacy > VPN",
  "Adblocking / Privacy > Encrypted Messengers",
  "Adblocking / Privacy > Password Privacy / 2FA",
  "Tools > File Tools > Cloud Storage",
  "Tools > File Tools > Converters",
  "Tools > Image Tools > Editors",
  "Tools > Video Tools > Editors",
  "Development > Code Repositories",
  "Development > Tools > IDEs",
  "Development > Tools > Frameworks",
  "Education > Learning Platforms",
  "Education > Programming Tutorials",
  "Entertainment > Streaming > Video",
  "Entertainment > Streaming > Music",
  "Entertainment > Gaming > Platforms",
  "Business > Productivity > Project Management",
  "Business > Finance > Banking",
  "Shopping > E-commerce > General",
  "News > Technology News",
  "Social Media > Platforms",
  "Tools > Utilities",
  ... (create as many specific categories as needed for comprehensive organization)
]

**CRITICAL FORMATTING REQUIREMENTS:**
- **PROPER CAPITALIZATION:** Use Title Case for all category names
- **TECHNICAL TERMS:** Capitalize correctly (JavaScript, Node.js, API, UI, UX, SEO, AI, etc.)
- **SEPARATORS:** Use " > " (space-greater-than-space) as the separator
- **CONSISTENCY:** Maintain consistent capitalization throughout all categories
- **PROFESSIONAL APPEARANCE:** Categories should look polished and ready for professional use

**CONTENT REQUIREMENTS:**
- Create FUNCTIONAL categories that group services by what they do
- Generate AS MANY functional category trees as needed (NO MAXIMUM LIMIT)
- Create comprehensive, specific categories for every type of service found
- NEVER use "Other" - all bookmarks must be categorized into specific functional categories
- If unsure, create new appropriate functional categories rather than using generic ones
- Organize by function, not by service provider or company name
- Follow FMHY-style functional organization principles
- Prioritize comprehensive coverage over category count limits

Return only the JSON array with properly formatted category names, no additional text or formatting.`;

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
                    // Remove any "Other" categories if they exist
                    const filteredCategories = categories.filter(cat => cat !== 'Other' && !cat.includes('Other'));

                    // Ensure we have comprehensive functional categories
                    const essentialCategories = [
                        'Tools > Utilities',
                        'Development > Tools',
                        'Business > Productivity',
                        'Entertainment > General',
                        'Education > Resources'
                    ];

                    essentialCategories.forEach(essential => {
                        if (!filteredCategories.some(cat => cat === essential)) {
                            filteredCategories.push(essential);
                        }
                    });

                    console.log('Successfully generated dynamic categories:', filteredCategories);
                    return filteredCategories;
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
                const requestStart = Date.now();
                const response = await fetch(currentUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    },
                    body: JSON.stringify(requestBody)
                });
                const responseTime = Date.now() - requestStart;

                if (response.ok) {
                    const data = await response.json();

                    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                        const responseText = data.candidates[0].content.parts[0].text;
                        console.log(`✅ SUCCESS with ${currentModel}`);

                        // Record API usage analytics
                        if (this.analyticsService) {
                            await this.analyticsService.recordApiUsage({
                                provider: 'gemini',
                                model: currentModel,
                                success: true,
                                responseTime,
                                batchSize: batch.length,
                                tokensUsed: data.usageMetadata?.totalTokenCount || 0
                            });
                        }

                        return this._parseResponse(responseText, batch);
                    } else {
                        throw new Error('Invalid API response format');
                    }
                } else {
                    const errorText = await response.text();
                    console.error(`❌ ${currentModel} failed:`, response.status, errorText);

                    // Record API failure analytics
                    if (this.analyticsService) {
                        await this.analyticsService.recordApiUsage({
                            provider: 'gemini',
                            model: currentModel,
                            success: false,
                            responseTime,
                            batchSize: batch.length,
                            errorType: `${response.status}`
                        });
                    }

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

        // All Gemini models failed
        console.error('❌ All Gemini models failed.');

        // Reset to original model for next batch
        this.currentModelIndex = originalModelIndex;

        throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
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

**CRITICAL CATEGORIZATION INSTRUCTIONS:**
- **NEVER USE "OTHER":** ABSOLUTELY FORBIDDEN to use "Other" category - ALL bookmarks must be categorized into specific functional categories
- **MANDATORY CATEGORIZATION:** Every bookmark MUST be assigned to a specific functional category from the available list
- **ANALYZE CURRENT CATEGORY:** Look at the bookmark's current category and determine if it's appropriate
- **CHANGE WRONG CATEGORIES:** If the current category is incorrect, assign the correct one from the available list
- **CONTENT-BASED CATEGORIZATION:** Use URL domain, path, title, and content type to determine the correct category
- **FUNCTIONAL GROUPING:** Group services by what they DO, not who provides them
- **FALLBACK STRATEGY:** If unsure, use "Tools > Utilities" for general tools, but prefer specific functional categories
- **RESPECT CONTENT TYPE:** Match the actual content type to appropriate functional categories
- **USE RISK FLAGS:** Pay attention to risk flags and categorize accordingly
- **USER-FRIENDLY:** Choose categories that users will easily understand and remember

**FUNCTIONAL CATEGORIZATION RULES BY CONTENT TYPE (FMHY-Style):**
- **Cloud Storage Services:** Should go to "Tools > File Tools > Cloud Storage" (Google Drive, Dropbox, OneDrive, MEGA, pCloud)
- **VPN Services:** Should go to "Adblocking / Privacy > VPN" (ProtonVPN, Mullvad, AirVPN, Windscribe)
- **Password Managers/2FA:** Should go to "Adblocking / Privacy > Password Privacy / 2FA" (KeePassXC, Aegis, 2FAS)
- **Encrypted Messengers:** Should go to "Adblocking / Privacy > Encrypted Messengers" (Signal, Matrix, Wire)
- **Search Engines:** Should go to "Web Privacy > Search Engines" (DuckDuckGo, Brave Search, Startpage)
- **Antivirus/Security:** Should go to "Adblocking / Privacy > Antivirus / Anti-Malware" (Malwarebytes, ESET)
- **DNS Services:** Should go to "Adblocking / Privacy > DNS Adblocking" (Pi-Hole, AdGuard DNS, NextDNS)
- **Virtual Machines:** Should go to "Tools > System Tools > Virtual Machines" (VMware, VirtualBox, QEMU)
- **Code Repositories:** Should go to "Development > Code Repositories" (GitHub, GitLab, Bitbucket)
- **Streaming Services:** Should go to "Entertainment > Streaming" (Netflix, YouTube, Twitch, Spotify)
- **E-commerce Sites:** Should go to "Shopping > E-commerce" (Amazon, eBay, Etsy)
- **Privacy Guides:** Should go to "Education > Privacy Guides" (Privacy Guides, The New Oil)

**FUNCTIONAL CATEGORIZATION EXAMPLES (Based on FMHY Structure):**
- ✅ GOOD: "Adblocking / Privacy > VPN" (ProtonVPN, Mullvad, AirVPN - grouped by function)
- ✅ GOOD: "Tools > File Tools > Cloud Storage" (Google Drive, Dropbox, OneDrive - grouped by what they do)
- ✅ GOOD: "Adblocking / Privacy > Encrypted Messengers" (Signal, Matrix, Wire - grouped by function)
- ✅ GOOD: "Education > Privacy Guides" (Privacy Guides, The New Oil - grouped by content type)
- ✅ GOOD: "Web Privacy > Search Engines" (DuckDuckGo, Brave Search, Startpage - grouped by function)
- ❌ WRONG: "Google > Drive" (organized by service provider, not function)
- ❌ WRONG: "Microsoft > OneDrive" (organized by company, not what it does)
- ❌ WRONG: "Popular Tools" (catch-all category, not functional)

**FUNCTIONAL CATEGORIZATION RULES:**
- Use MAXIMUM 2-3 levels of hierarchy for ALL bookmarks
- Organize by FUNCTION/PURPOSE, not by service provider or company name
- Group services that do the same thing together (e.g., all cloud storage services together)
- Categories should describe WHAT THE SERVICE DOES, not WHO PROVIDES IT
- Follow FMHY-style functional organization: Category > Subcategory > Item
- Cloud storage should contain ALL cloud storage services (Google Drive, Dropbox, OneDrive, etc.)
- VPN category should contain ALL VPN services (ProtonVPN, Mullvad, etc.)
- Never create categories named after specific companies or services

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

**CATEGORY NAME FORMATTING REQUIREMENTS:**
- **USE EXACT CATEGORY NAMES:** Select categories from the available list using their exact capitalization
- **PROPER TECHNICAL TERMS:** When categories contain technical terms, ensure they're properly capitalized
- **CONSISTENT FORMATTING:** Match the formatting style of the provided categories exactly
- **PROFESSIONAL APPEARANCE:** Categories should look polished and professional

**CATEGORY FORMATTING EXAMPLES:**
- ✅ CORRECT: "Development > Frontend > JavaScript" (proper technical term capitalization)
- ✅ CORRECT: "Business > Marketing > SEO" (acronym properly capitalized)
- ✅ CORRECT: "Design > UI & UX > Resources" (acronyms and spacing correct)
- ✅ CORRECT: "Technology > AI & Machine Learning" (proper acronym and title case)
- ❌ WRONG: "development > frontend > javascript" (all lowercase)
- ❌ WRONG: "Business > Marketing > seo" (inconsistent capitalization)
- ❌ WRONG: "design > ui&ux > resources" (poor spacing and capitalization)

**LEARNING DATA - CRITICAL CATEGORIZATION PATTERNS:**
Based on previous user corrections and manual categorizations, follow these patterns EXACTLY:`;

        // Add learning data if available
        if (Object.keys(learningData).length > 0) {
            prompt += `\n**USER-CORRECTED PATTERNS (HIGHEST PRIORITY):**`;
            for (const [pattern, category] of Object.entries(learningData)) {
                prompt += `\n- ✅ URLs/titles containing "${pattern}" → MUST go to "${category}"`;
            }
            prompt += `\n\n**IMPORTANT:** These patterns are based on user corrections. Follow them exactly to avoid repeating mistakes.`;
        } else {
            prompt += '\n- No previous learning data available - use content analysis for categorization';
        }

        prompt += '\n\n**Bookmarks to Categorize:**';

        bookmarks.forEach((bookmark, index) => {
            const title = bookmark.title || 'Untitled';
            const url = bookmark.url || '';
            const currentFolder = bookmark.currentFolderName || 'Root';
            const folderPath = bookmark.currentFolder || 'Root';
            let domain = 'unknown';
            let urlPath = '';

            try {
                if (url) {
                    const urlObj = new URL(url);
                    domain = urlObj.hostname.replace('www.', '');
                    urlPath = urlObj.pathname + urlObj.search;
                }
            } catch (e) {
                domain = 'invalid-url';
            }

            // Extract additional context from URL and title
            const urlKeywords = this._extractUrlKeywords(url, title);
            const contentType = this._detectContentType(url, title);
            const riskFlags = this._detectRiskFlags(url, title);

            prompt += `\n${index + 1}. BOOKMARK ANALYSIS:`;
            prompt += `\n   Current Title: "${title}"`;
            prompt += `\n   Current Category: "${currentFolder}" (Path: ${folderPath})`;
            prompt += `\n   Domain: "${domain}"`;
            prompt += `\n   URL Path: "${urlPath}"`;
            prompt += `\n   Full URL: "${url}"`;
            prompt += `\n   Content Type: ${contentType}`;
            prompt += `\n   Keywords: ${urlKeywords.join(', ')}`;
            if (riskFlags.length > 0) {
                prompt += `\n   ⚠️ RISK FLAGS: ${riskFlags.join(', ')}`;
            }
            prompt += `\n   ---`;
        });

        prompt += `\n\n**OUTPUT REQUIREMENTS:**
- Return JSON array with same number of items as input bookmarks
- Each item must have 'id' (bookmark position 1-${bookmarks.length}), 'category' (full hierarchical path), 'title' (improved descriptive title), 'confidence' (0.0-1.0), and 'categoryChanged' (true/false)
- **ABSOLUTELY NO "OTHER" CATEGORY:** NEVER use "Other" - this is strictly forbidden
- **MANDATORY SPECIFIC CATEGORIZATION:** Every bookmark MUST be assigned to a specific functional category
- **ANALYZE CURRENT CATEGORY:** Compare the current category with the correct category based on content analysis
- **CHANGE WRONG CATEGORIES:** If current category is incorrect, assign the correct one and set 'categoryChanged': true
- **USE EXACT CATEGORY NAMES:** Select categories from the available list using their exact capitalization and formatting
- **MAINTAIN PROPER FORMATTING:** Category must be the full path with proper capitalization (e.g., "Adblocking / Privacy > VPN")
- **TECHNICAL TERMS:** Ensure technical terms in categories are properly capitalized (JavaScript, API, UI, etc.)
- **FUNCTIONAL CATEGORIZATION:** Match actual content to appropriate functional categories based on what the service DOES
- **FOLLOW LEARNING DATA:** Prioritize user-corrected patterns from learning data
- **FALLBACK STRATEGY:** If genuinely unsure, use "Tools > Utilities" but prefer specific functional categories
- Title must be descriptive and informative, based on URL domain and content context
- Choose the most appropriate functional category that describes what the service does
- Consider URL domain, title content, risk flags, and content type for accurate functional categorization
- Prefer practical, functional categories that group services by their purpose

**EXAMPLE OUTPUT (FMHY-Style Functional Categories - NO "OTHER" ALLOWED):**
[
  {"id": 1, "category": "Development > Documentation", "title": "React Documentation - JavaScript Library Guide", "confidence": 0.9, "categoryChanged": false},
  {"id": 2, "category": "Tools > File Tools > Cloud Storage", "title": "Google Drive - Cloud Storage Service", "confidence": 0.8, "categoryChanged": true},
  {"id": 3, "category": "Adblocking / Privacy > VPN", "title": "ProtonVPN - Privacy-Focused VPN Service", "confidence": 0.9, "categoryChanged": true},
  {"id": 4, "category": "Tools > Utilities", "title": "Generic Tool - General Utility", "confidence": 0.7, "categoryChanged": true}
]

**FUNCTIONAL CATEGORIZATION EXAMPLES (FMHY-Style):**
- Google Drive currently in "Google Services" → Should be "Tools > File Tools > Cloud Storage" (categoryChanged: true)
- ProtonVPN currently in "VPN Services" → Should be "Adblocking / Privacy > VPN" (categoryChanged: true)
- GitHub repo currently in "Uncategorized" → Should be "Development > Code Repositories" (categoryChanged: true)
- Signal app currently in "Communication" → Should be "Adblocking / Privacy > Encrypted Messengers" (categoryChanged: true)
- DuckDuckGo currently in "Search" → Should be "Web Privacy > Search Engines" (categoryChanged: true)

**FINAL INSTRUCTIONS:**
- **ABSOLUTELY NO "OTHER" CATEGORY ALLOWED** - completely forbidden
- **CREATE UNLIMITED CATEGORIES** - generate as many specific functional categories as needed
- **BE COMPREHENSIVE** - create detailed, specific categories for every type of service found
- **NO CATEGORY LIMITS** - don't restrict yourself to a small number of categories
- Every bookmark must be categorized into a specific functional category
- If you cannot determine the exact function, create a new appropriate category or use "Tools > Utilities"
- Prioritize comprehensive, detailed organization over simplicity

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

            // Map results to bookmark IDs and include titles with validation
            const results = parsed.map((result, index) => {
                let category = result.category || 'Tools > Utilities';

                // CRITICAL: Validate that "Other" is never used
                if (category === 'Other' || category.includes('Other')) {
                    console.warn(`⚠️ AI tried to use forbidden "Other" category for bookmark ${index + 1}. Forcing to "Tools > Utilities"`);
                    category = 'Tools > Utilities';
                }

                // Ensure category is not empty
                if (!category || category.trim() === '') {
                    console.warn(`⚠️ Empty category detected for bookmark ${index + 1}. Using "Tools > Utilities"`);
                    category = 'Tools > Utilities';
                }

                return {
                    id: result.id || (index + 1),
                    bookmarkId: batch[index]?.id,
                    category: category,
                    title: result.title || batch[index]?.title || 'Untitled',
                    confidence: result.confidence || 0.5
                };
            });

            // Final validation: Check if any "Other" categories slipped through
            const otherCategories = results.filter(r => r.category === 'Other' || r.category.includes('Other'));
            if (otherCategories.length > 0) {
                console.error('🚨 CRITICAL: "Other" categories detected after validation!', otherCategories);
                throw new Error('AI returned forbidden "Other" categories despite explicit instructions');
            }

            return results;

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
            const testResponse = await fetch(this.getCurrentModelUrl(), {
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
            functionalMode: true, // FMHY-style functional organization
            maxCategoryDepth: 3, // Allow 2-3 levels for functional organization
            batchSize: 50, // Default batch size
            // NO LIMITS on category count - generate as many as needed for proper organization
            unlimitedCategories: true
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
