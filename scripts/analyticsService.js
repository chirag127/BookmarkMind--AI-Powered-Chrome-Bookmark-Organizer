/**
 * BookmarkMind - Analytics Service
 * Tracks and provides metrics for categorization performance and system behavior
 */

class AnalyticsService {
    constructor() {
        this.storageKey = 'bookmarkMindAnalytics';
        this.sessionKey = 'bookmarkMindSession';
    }

    /**
     * Initialize analytics with default data
     */
    async initialize() {
        const existing = await this._getAnalytics();
        if (!existing || !existing.version) {
            await this._resetAnalytics();
        }
    }

    /**
     * Record a categorization session
     * @param {Object} sessionData - Session metrics
     */
    async recordCategorizationSession(sessionData) {
        const analytics = await this._getAnalytics();
        
        const session = {
            timestamp: Date.now(),
            bookmarksProcessed: sessionData.processed || 0,
            bookmarksCategorized: sessionData.categorized || 0,
            errors: sessionData.errors || 0,
            duration: sessionData.duration || 0,
            categoriesUsed: sessionData.categories || [],
            successRate: this._calculateSuccessRate(sessionData.categorized, sessionData.processed),
            avgTimePerBookmark: this._calculateAvgTime(sessionData.duration, sessionData.processed),
            mode: sessionData.mode || 'full' // 'full', 'bulk', or 'single'
        };

        analytics.sessions.push(session);
        analytics.totalCategorizations += session.bookmarksCategorized;
        analytics.totalErrors += session.errors;
        
        // Update category usage stats
        session.categoriesUsed.forEach(category => {
            analytics.categoryUsage[category] = (analytics.categoryUsage[category] || 0) + 1;
        });

        // Keep only last 100 sessions
        if (analytics.sessions.length > 100) {
            analytics.sessions = analytics.sessions.slice(-100);
        }

        await this._saveAnalytics(analytics);
    }

    /**
     * Record API usage
     * @param {Object} apiData - API call metrics
     */
    async recordApiUsage(apiData) {
        const analytics = await this._getAnalytics();
        
        const apiCall = {
            timestamp: Date.now(),
            provider: apiData.provider || 'gemini',
            model: apiData.model || 'unknown',
            tokensUsed: apiData.tokensUsed || 0,
            success: apiData.success !== false,
            responseTime: apiData.responseTime || 0,
            batchSize: apiData.batchSize || 1,
            errorType: apiData.errorType || null
        };

        analytics.apiCalls.push(apiCall);
        analytics.totalApiCalls++;
        
        if (apiCall.success) {
            analytics.successfulApiCalls++;
        } else {
            analytics.failedApiCalls++;
        }

        // Track by provider
        const providerKey = apiCall.provider;
        if (!analytics.apiByProvider[providerKey]) {
            analytics.apiByProvider[providerKey] = {
                total: 0,
                successful: 0,
                failed: 0,
                totalTokens: 0
            };
        }
        analytics.apiByProvider[providerKey].total++;
        analytics.apiByProvider[providerKey].totalTokens += apiCall.tokensUsed;
        if (apiCall.success) {
            analytics.apiByProvider[providerKey].successful++;
        } else {
            analytics.apiByProvider[providerKey].failed++;
        }

        // Keep only last 1000 API calls
        if (analytics.apiCalls.length > 1000) {
            analytics.apiCalls = analytics.apiCalls.slice(-1000);
        }

        await this._saveAnalytics(analytics);
    }

    /**
     * Record processing time for a specific operation
     * @param {string} operation - Operation name
     * @param {number} duration - Duration in milliseconds
     */
    async recordProcessingTime(operation, duration) {
        const analytics = await this._getAnalytics();
        
        if (!analytics.processingTimes[operation]) {
            analytics.processingTimes[operation] = [];
        }

        analytics.processingTimes[operation].push({
            timestamp: Date.now(),
            duration
        });

        // Keep only last 100 measurements per operation
        if (analytics.processingTimes[operation].length > 100) {
            analytics.processingTimes[operation] = analytics.processingTimes[operation].slice(-100);
        }

        await this._saveAnalytics(analytics);
    }

    /**
     * Record folder consolidation metrics
     * @param {Object} consolidationData - Consolidation results
     */
    async recordConsolidation(consolidationData) {
        const analytics = await this._getAnalytics();
        
        const consolidation = {
            timestamp: Date.now(),
            foldersProcessed: consolidationData.foldersProcessed || 0,
            bookmarksMoved: consolidationData.bookmarksMoved || 0,
            foldersRemoved: consolidationData.foldersRemoved || 0,
            consolidationPaths: consolidationData.consolidationPaths || []
        };

        analytics.consolidations.push(consolidation);
        analytics.totalFoldersConsolidated += consolidation.foldersRemoved;
        analytics.totalBookmarksReorganized += consolidation.bookmarksMoved;

        // Keep only last 50 consolidations
        if (analytics.consolidations.length > 50) {
            analytics.consolidations = analytics.consolidations.slice(-50);
        }

        await this._saveAnalytics(analytics);
    }

    /**
     * Get comprehensive analytics report
     * @returns {Promise<Object>} Analytics report
     */
    async getAnalyticsReport() {
        const analytics = await this._getAnalytics();
        const now = Date.now();
        
        // Calculate various metrics
        const last24h = now - 24 * 60 * 60 * 1000;
        const last7d = now - 7 * 24 * 60 * 60 * 1000;
        const last30d = now - 30 * 24 * 60 * 60 * 1000;

        return {
            overview: {
                totalCategorizations: analytics.totalCategorizations,
                totalErrors: analytics.totalErrors,
                totalApiCalls: analytics.totalApiCalls,
                successfulApiCalls: analytics.successfulApiCalls,
                failedApiCalls: analytics.failedApiCalls,
                totalFoldersConsolidated: analytics.totalFoldersConsolidated,
                totalBookmarksReorganized: analytics.totalBookmarksReorganized,
                overallSuccessRate: this._calculateSuccessRate(
                    analytics.totalCategorizations,
                    analytics.totalCategorizations + analytics.totalErrors
                )
            },
            
            recentActivity: {
                last24h: this._getSessionMetrics(analytics.sessions, last24h, now),
                last7d: this._getSessionMetrics(analytics.sessions, last7d, now),
                last30d: this._getSessionMetrics(analytics.sessions, last30d, now)
            },

            categoryStats: {
                usage: analytics.categoryUsage,
                topCategories: this._getTopCategories(analytics.categoryUsage, 10),
                uniqueCategories: Object.keys(analytics.categoryUsage).length
            },

            apiStats: {
                byProvider: analytics.apiByProvider,
                recentCalls: {
                    last24h: this._getApiMetrics(analytics.apiCalls, last24h, now),
                    last7d: this._getApiMetrics(analytics.apiCalls, last7d, now),
                    last30d: this._getApiMetrics(analytics.apiCalls, last30d, now)
                },
                avgResponseTime: this._calculateAvgResponseTime(analytics.apiCalls)
            },

            performance: {
                avgProcessingTimes: this._calculateAvgProcessingTimes(analytics.processingTimes),
                recentProcessingTimes: this._getRecentProcessingTimes(analytics.processingTimes)
            },

            consolidation: {
                totalConsolidations: analytics.consolidations.length,
                totalFoldersRemoved: analytics.totalFoldersConsolidated,
                totalBookmarksMoved: analytics.totalBookmarksReorganized,
                recent: analytics.consolidations.slice(-10)
            },

            sessions: analytics.sessions.slice(-20), // Last 20 sessions
            
            metadata: {
                firstUsed: analytics.firstUsed,
                lastUpdated: analytics.lastUpdated,
                version: analytics.version
            }
        };
    }

    /**
     * Get success rate percentage
     * @param {number} successful - Successful operations
     * @param {number} total - Total operations
     * @returns {number} Success rate percentage
     */
    _calculateSuccessRate(successful, total) {
        if (total === 0) return 0;
        return Math.round((successful / total) * 100);
    }

    /**
     * Calculate average time per operation
     * @param {number} totalDuration - Total duration
     * @param {number} count - Number of operations
     * @returns {number} Average time in milliseconds
     */
    _calculateAvgTime(totalDuration, count) {
        if (count === 0) return 0;
        return Math.round(totalDuration / count);
    }

    /**
     * Get session metrics for a time period
     * @param {Array} sessions - All sessions
     * @param {number} startTime - Period start timestamp
     * @param {number} endTime - Period end timestamp
     * @returns {Object} Period metrics
     */
    _getSessionMetrics(sessions, startTime, endTime) {
        const periodSessions = sessions.filter(s => 
            s.timestamp >= startTime && s.timestamp <= endTime
        );

        const totalProcessed = periodSessions.reduce((sum, s) => sum + s.bookmarksProcessed, 0);
        const totalCategorized = periodSessions.reduce((sum, s) => sum + s.bookmarksCategorized, 0);
        const totalErrors = periodSessions.reduce((sum, s) => sum + s.errors, 0);
        const totalDuration = periodSessions.reduce((sum, s) => sum + s.duration, 0);

        return {
            sessions: periodSessions.length,
            bookmarksProcessed: totalProcessed,
            bookmarksCategorized: totalCategorized,
            errors: totalErrors,
            avgDuration: periodSessions.length > 0 ? Math.round(totalDuration / periodSessions.length) : 0,
            successRate: this._calculateSuccessRate(totalCategorized, totalProcessed)
        };
    }

    /**
     * Get API metrics for a time period
     * @param {Array} apiCalls - All API calls
     * @param {number} startTime - Period start timestamp
     * @param {number} endTime - Period end timestamp
     * @returns {Object} Period metrics
     */
    _getApiMetrics(apiCalls, startTime, endTime) {
        const periodCalls = apiCalls.filter(c => 
            c.timestamp >= startTime && c.timestamp <= endTime
        );

        const successful = periodCalls.filter(c => c.success).length;
        const failed = periodCalls.filter(c => !c.success).length;
        const totalTokens = periodCalls.reduce((sum, c) => sum + c.tokensUsed, 0);
        const totalResponseTime = periodCalls.reduce((sum, c) => sum + c.responseTime, 0);

        return {
            total: periodCalls.length,
            successful,
            failed,
            successRate: this._calculateSuccessRate(successful, periodCalls.length),
            totalTokens,
            avgResponseTime: periodCalls.length > 0 ? Math.round(totalResponseTime / periodCalls.length) : 0
        };
    }

    /**
     * Get top categories by usage
     * @param {Object} categoryUsage - Category usage map
     * @param {number} limit - Number of top categories
     * @returns {Array} Top categories
     */
    _getTopCategories(categoryUsage, limit) {
        return Object.entries(categoryUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([category, count]) => ({ category, count }));
    }

    /**
     * Calculate average response time for API calls
     * @param {Array} apiCalls - API calls
     * @returns {number} Average response time
     */
    _calculateAvgResponseTime(apiCalls) {
        if (apiCalls.length === 0) return 0;
        const totalTime = apiCalls.reduce((sum, c) => sum + c.responseTime, 0);
        return Math.round(totalTime / apiCalls.length);
    }

    /**
     * Calculate average processing times for each operation
     * @param {Object} processingTimes - Processing times by operation
     * @returns {Object} Average times
     */
    _calculateAvgProcessingTimes(processingTimes) {
        const result = {};
        
        for (const [operation, times] of Object.entries(processingTimes)) {
            if (times.length > 0) {
                const totalDuration = times.reduce((sum, t) => sum + t.duration, 0);
                result[operation] = Math.round(totalDuration / times.length);
            }
        }

        return result;
    }

    /**
     * Get recent processing times
     * @param {Object} processingTimes - Processing times by operation
     * @returns {Object} Recent times
     */
    _getRecentProcessingTimes(processingTimes) {
        const result = {};
        
        for (const [operation, times] of Object.entries(processingTimes)) {
            result[operation] = times.slice(-10);
        }

        return result;
    }

    /**
     * Export analytics data
     * @returns {Promise<Object>} Analytics data
     */
    async exportAnalytics() {
        return await this._getAnalytics();
    }

    /**
     * Clear all analytics data
     */
    async clearAnalytics() {
        await this._resetAnalytics();
    }

    /**
     * Get analytics from storage
     * @private
     */
    async _getAnalytics() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            return result[this.storageKey] || this._getDefaultAnalytics();
        } catch (error) {
            console.error('Error getting analytics:', error);
            return this._getDefaultAnalytics();
        }
    }

    /**
     * Save analytics to storage
     * @private
     */
    async _saveAnalytics(analytics) {
        try {
            analytics.lastUpdated = Date.now();
            await chrome.storage.local.set({ [this.storageKey]: analytics });
        } catch (error) {
            console.error('Error saving analytics:', error);
        }
    }

    /**
     * Reset analytics to default state
     * @private
     */
    async _resetAnalytics() {
        const defaults = this._getDefaultAnalytics();
        defaults.firstUsed = Date.now();
        await this._saveAnalytics(defaults);
    }

    /**
     * Get default analytics structure
     * @private
     */
    _getDefaultAnalytics() {
        return {
            version: '1.0',
            firstUsed: Date.now(),
            lastUpdated: Date.now(),
            
            // Overall stats
            totalCategorizations: 0,
            totalErrors: 0,
            totalApiCalls: 0,
            successfulApiCalls: 0,
            failedApiCalls: 0,
            totalFoldersConsolidated: 0,
            totalBookmarksReorganized: 0,

            // Detailed data
            sessions: [],
            apiCalls: [],
            consolidations: [],
            categoryUsage: {},
            apiByProvider: {},
            processingTimes: {}
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AnalyticsService = AnalyticsService;
}

// For service worker context
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.AnalyticsService = AnalyticsService;
}
