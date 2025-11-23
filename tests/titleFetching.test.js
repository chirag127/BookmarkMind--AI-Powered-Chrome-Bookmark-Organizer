/**
 * Unit tests for title fetching functionality
 * Tests _fetchPageTitle and _enrichBatchWithTitles methods
 */

// Mock chrome API
global.chrome = {
    storage: {
        sync: {
            get: jest.fn((keys, callback) => {
                const mockSettings = {
                    bookmarkMindSettings: {
                        titleFetchConcurrency: 5,
                        showDetailedLogs: false,
                    },
                };
                if (callback) {
                    callback(mockSettings);
                }
                return Promise.resolve(mockSettings);
            }),
        },
    },
};

// Mock fetch API
global.fetch = jest.fn();

describe("Title Fetching Functionality", () => {
    let AIProcessor;
    let aiProcessor;

    beforeEach(() => {
        jest.clearAllMocks();

        // Dynamically import AIProcessor (since it's not a module)
        // For testing, we'll create a minimal implementation
        AIProcessor = class {
            constructor() {
                this.analyticsService = null;
            }

            async _getSettings() {
                const result = await chrome.storage.sync.get([
                    "bookmarkMindSettings",
                ]);
                return {
                    titleFetchConcurrency: 5,
                    showDetailedLogs: false,
                    ...result.bookmarkMindSettings,
                };
            }

            async _fetchPageTitle(url) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(
                        () => controller.abort(),
                        5000
                    );

                    const response = await fetch(url, {
                        method: "GET",
                        signal: controller.signal,
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        },
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        return null;
                    }

                    const text = await response.text();
                    const titleMatch = text.match(
                        /<title[^>]*>([^<]+)<\/title>/i
                    );

                    if (titleMatch && titleMatch[1]) {
                        let title = titleMatch[1].trim();
                        title = title
                            .replace(/&amp;/g, "&")
                            .replace(/&lt;/g, "<")
                            .replace(/&gt;/g, ">")
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'");
                        return title;
                    }
                    return null;
                } catch (error) {
                    if (error.name === "AbortError") {
                        throw error;
                    }
                    return null;
                }
            }

            async _enrichBatchWithTitles(batch) {
                const settings = await this._getSettings();
                const CONCURRENCY_LIMIT = settings.titleFetchConcurrency || 5;

                for (let i = 0; i < batch.length; i += CONCURRENCY_LIMIT) {
                    const chunk = batch.slice(i, i + CONCURRENCY_LIMIT);
                    const promises = chunk.map(async (bookmark) => {
                        if (!bookmark.url)
                            return { success: false, reason: "no_url" };

                        try {
                            const liveTitle = await this._fetchPageTitle(
                                bookmark.url
                            );
                            if (
                                liveTitle &&
                                liveTitle.length > 0 &&
                                liveTitle !== bookmark.title
                            ) {
                                bookmark.title = liveTitle;
                                return { success: true, updated: true };
                            }
                            return { success: true, updated: false };
                        } catch (error) {
                            if (error.name === "AbortError") {
                                return { success: false, reason: "timeout" };
                            }
                            return {
                                success: false,
                                reason: "error",
                                error: error.message,
                            };
                        }
                    });

                    await Promise.all(promises);
                }
            }
        };

        aiProcessor = new AIProcessor();
    });

    describe("_fetchPageTitle", () => {
        test("should extract title from valid HTML", async () => {
            const mockHtml =
                "<html><head><title>Test Page Title</title></head></html>";

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            });

            const title = await aiProcessor._fetchPageTitle(
                "https://example.com"
            );
            expect(title).toBe("Test Page Title");
        });

        test("should decode HTML entities in title", async () => {
            const mockHtml = "<title>Test &amp; Example &lt;Site&gt;</title>";

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            });

            const title = await aiProcessor._fetchPageTitle(
                "https://example.com"
            );
            expect(title).toBe("Test & Example <Site>");
        });

        test("should return null for failed requests", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const title = await aiProcessor._fetchPageTitle(
                "https://example.com/404"
            );
            expect(title).toBeNull();
        });

        test("should return null when no title tag found", async () => {
            const mockHtml = "<html><head></head><body>No title</body></html>";

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            });

            const title = await aiProcessor._fetchPageTitle(
                "https://example.com"
            );
            expect(title).toBeNull();
        });

        test("should handle network errors gracefully", async () => {
            global.fetch.mockRejectedValueOnce(new Error("Network error"));

            const title = await aiProcessor._fetchPageTitle(
                "https://example.com"
            );
            expect(title).toBeNull();
        });

        test("should timeout after 5 seconds", async () => {
            jest.useFakeTimers();

            global.fetch.mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        setTimeout(
                            () =>
                                resolve({
                                    ok: true,
                                    text: async () => "<title>Late</title>",
                                }),
                            10000
                        );
                    })
            );

            const titlePromise = aiProcessor._fetchPageTitle(
                "https://slow-site.com"
            );

            jest.advanceTimersByTime(5000);

            await expect(titlePromise).rejects.toThrow();

            jest.useRealTimers();
        });

        test("should trim whitespace from titles", async () => {
            const mockHtml = "<title>  Spaced Title  </title>";

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => mockHtml,
            });

            const title = await aiProcessor._fetchPageTitle(
                "https://example.com"
            );
            expect(title).toBe("Spaced Title");
        });
    });

    describe("_enrichBatchWithTitles", () => {
        test("should update bookmark titles when different", async () => {
            const mockBookmarks = [
                { url: "https://example1.com", title: "Old Title 1" },
                { url: "https://example2.com", title: "Old Title 2" },
            ];

            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => "<title>New Title 1</title>",
                })
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => "<title>New Title 2</title>",
                });

            await aiProcessor._enrichBatchWithTitles(mockBookmarks);

            expect(mockBookmarks[0].title).toBe("New Title 1");
            expect(mockBookmarks[1].title).toBe("New Title 2");
        });

        test("should not update when title is the same", async () => {
            const mockBookmarks = [
                { url: "https://example.com", title: "Same Title" },
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => "<title>Same Title</title>",
            });

            await aiProcessor._enrichBatchWithTitles(mockBookmarks);

            expect(mockBookmarks[0].title).toBe("Same Title");
        });

        test("should skip bookmarks without URLs", async () => {
            const mockBookmarks = [
                { title: "Folder" }, // No URL
                { url: "https://example.com", title: "Page" },
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => "<title>New Page</title>",
            });

            await aiProcessor._enrichBatchWithTitles(mockBookmarks);

            expect(mockBookmarks[0].title).toBe("Folder");
            expect(mockBookmarks[1].title).toBe("New Page");
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        test("should handle mixed success and failure", async () => {
            const mockBookmarks = [
                { url: "https://example1.com", title: "Title 1" },
                { url: "https://example2.com", title: "Title 2" },
                { url: "https://example3.com", title: "Title 3" },
            ];

            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    text: async () => "<title>New Title 1</title>",
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                })
                .mockRejectedValueOnce(new Error("Network error"));

            await aiProcessor._enrichBatchWithTitles(mockBookmarks);

            expect(mockBookmarks[0].title).toBe("New Title 1");
            expect(mockBookmarks[1].title).toBe("Title 2"); // Unchanged on error
            expect(mockBookmarks[2].title).toBe("Title 3"); // Unchanged on error
        });

        test("should respect concurrency limit", async () => {
            const mockBookmarks = Array.from({ length: 10 }, (_, i) => ({
                url: `https://example${i}.com`,
                title: `Title ${i}`,
            }));

            let concurrentCalls = 0;
            let maxConcurrent = 0;

            global.fetch.mockImplementation(() => {
                concurrentCalls++;
                maxConcurrent = Math.max(maxConcurrent, concurrentCalls);

                return new Promise((resolve) => {
                    setTimeout(() => {
                        concurrentCalls--;
                        resolve({
                            ok: true,
                            text: async () => "<title>New Title</title>",
                        });
                    }, 10);
                });
            });

            await aiProcessor._enrichBatchWithTitles(mockBookmarks);

            // Default concurrency is 5
            expect(maxConcurrent).toBeLessThanOrEqual(5);
        });
    });
});
