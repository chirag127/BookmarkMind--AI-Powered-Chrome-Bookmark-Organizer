# 🔗 RedirectResolver Service

## Overview

The `RedirectResolver` service is a powerful Chrome extension utility that resolves bookmark URLs to their final destinations by following HTTP redirects. It features intelligent caching, batch processing, retry logic, and comprehensive logging.

## Features

✅ **HTTP Redirect Resolution**
- Uses `fetch` with HEAD requests and `redirect: 'follow'` mode
- Resolves shortened URLs (bit.ly, t.co, goo.gl, etc.) to their final destinations
- Tracks complete redirect chains

✅ **High-Performance Batch Processing**
- Processes up to 20 URLs concurrently
- Optimized for large bookmark collections
- Progress tracking with callbacks

✅ **Intelligent Caching**
- Stores resolved URLs in `chrome.storage.local`
- 30-day cache expiration
- Prevents redundant network requests
- Cache management utilities

✅ **Robust Retry Logic**
- Automatic retry with exponential backoff
- Up to 3 retry attempts per URL
- Graceful failure handling

✅ **Comprehensive Logging**
- Detailed console output for every resolution
- Tracks original URL, final URL, and complete redirect chain
- Statistics for resolved, failed, unchanged, and cached URLs

✅ **Chrome Bookmarks Integration**
- Automatically updates bookmark URLs
- Preserves titles and folder locations
- Batch bookmark processing support

✅ **Request Configuration**
- 10-second timeout per request
- Custom User-Agent header
- AbortController for timeout handling

## Installation

The service is already included in the extension. No additional setup required.

```javascript
// Load the service (already available in extension context)
const resolver = new RedirectResolver();
```

## API Reference

### Constructor

```javascript
const resolver = new RedirectResolver();
```

Creates a new instance with default configuration:
- `CONCURRENT_LIMIT`: 20
- `REQUEST_TIMEOUT`: 10000ms (10 seconds)
- `MAX_RETRIES`: 3
- `CACHE_EXPIRY_DAYS`: 30

### Methods

#### `resolveUrl(url, retryCount = 0)`

Resolves a single URL to its final destination.

**Parameters:**
- `url` (string): URL to resolve
- `retryCount` (number): Current retry attempt (internal use)

**Returns:** Promise<Object>
```javascript
{
  originalUrl: string,
  finalUrl: string,
  chain: string[],
  success: boolean,
  cached: boolean,
  error?: string
}
```

**Example:**
```javascript
const result = await resolver.resolveUrl('https://bit.ly/example');
console.log(result.finalUrl); // https://example.com
console.log(result.chain); // ['https://bit.ly/example', 'https://example.com']
```

#### `resolveUrls(urls, progressCallback = null)`

Resolves multiple URLs with concurrent batch processing.

**Parameters:**
- `urls` (string[]): Array of URLs to resolve
- `progressCallback` (Function): Optional progress callback

**Returns:** Promise<Array>

**Example:**
```javascript
const urls = ['https://bit.ly/1', 'https://t.co/2', 'https://goo.gl/3'];

const results = await resolver.resolveUrls(urls, (progress) => {
  console.log(`${progress.percentage}% complete`);
});
```

#### `processBookmark(bookmark)`

Processes a single bookmark - resolves URL and updates if changed.

**Parameters:**
- `bookmark` (Object): Bookmark object with `id`, `url`, and `title`

**Returns:** Promise<Object>
```javascript
{
  bookmarkId: string,
  title: string,
  originalUrl: string,
  finalUrl: string,
  chain: string[],
  updated: boolean,
  success: boolean,
  error?: string
}
```

**Example:**
```javascript
const bookmark = {
  id: '123',
  title: 'My Bookmark',
  url: 'https://bit.ly/example'
};

const result = await resolver.processBookmark(bookmark);
console.log(`Updated: ${result.updated}`);
```

#### `processBookmarks(bookmarks, progressCallback = null)`

Processes multiple bookmarks with batch resolution and updates.

**Parameters:**
- `bookmarks` (Object[]): Array of bookmark objects
- `progressCallback` (Function): Optional progress callback

**Returns:** Promise<Object>
```javascript
{
  total: number,
  processed: number,
  updated: number,
  resolved: number,
  unchanged: number,
  failed: number,
  cached: number,
  results: Array
}
```

**Example:**
```javascript
const bookmarks = await getAllBookmarks(); // Your function to get bookmarks

const summary = await resolver.processBookmarks(bookmarks, (progress) => {
  console.log(`Progress: ${progress.percentage}%`);
  console.log(`Updated: ${progress.stats.updated}`);
});

console.log(`Total updated: ${summary.updated}`);
```

#### `getCacheInfo()`

Gets information about the current cache state.

**Returns:** Promise<Object>
```javascript
{
  totalEntries: number,
  validEntries: number,
  expiredEntries: number,
  expiryDays: number
}
```

**Example:**
```javascript
const info = await resolver.getCacheInfo();
console.log(`Cache has ${info.validEntries} valid entries`);
```

#### `cleanExpiredCache()`

Removes expired cache entries.

**Returns:** Promise<number> - Number of entries removed

**Example:**
```javascript
const removed = await resolver.cleanExpiredCache();
console.log(`Removed ${removed} expired entries`);
```

#### `clearCache()`

Clears the entire cache.

**Returns:** Promise<void>

**Example:**
```javascript
await resolver.clearCache();
console.log('Cache cleared');
```

#### `getStats()`

Gets statistics from the last processing run.

**Returns:** Promise<Object|null>
```javascript
{
  total: number,
  updated: number,
  resolved: number,
  unchanged: number,
  failed: number,
  cached: number,
  timestamp: number
}
```

**Example:**
```javascript
const stats = await resolver.getStats();
if (stats) {
  console.log(`Last run: ${new Date(stats.timestamp).toLocaleString()}`);
  console.log(`Updated: ${stats.updated} bookmarks`);
}
```

#### `getCurrentStats()`

Gets current session statistics (without saving).

**Returns:** Object

**Example:**
```javascript
const stats = resolver.getCurrentStats();
console.log(`Current session: ${stats.resolved} resolved`);
```

## Usage Examples

### Example 1: Resolve All Bookmarks

```javascript
async function resolveAllBookmarks() {
  const resolver = new RedirectResolver();
  
  // Get all bookmarks
  const tree = await chrome.bookmarks.getTree();
  const bookmarks = extractAllBookmarks(tree[0]);
  
  // Process with progress tracking
  const summary = await resolver.processBookmarks(bookmarks, (progress) => {
    console.log(`${progress.percentage}% complete`);
  });
  
  console.log(`Updated ${summary.updated} bookmarks`);
}
```

### Example 2: Resolve Shortened URLs Only

```javascript
async function resolveShortUrls() {
  const resolver = new RedirectResolver();
  
  // Get bookmarks
  const tree = await chrome.bookmarks.getTree();
  const allBookmarks = extractAllBookmarks(tree[0]);
  
  // Filter for likely shortened URLs
  const shortUrls = allBookmarks.filter(b => {
    const url = b.url.toLowerCase();
    return url.includes('bit.ly') || 
           url.includes('t.co') || 
           url.includes('goo.gl') ||
           url.includes('tinyurl');
  });
  
  console.log(`Found ${shortUrls.length} shortened URLs`);
  
  const summary = await resolver.processBookmarks(shortUrls);
  console.log(`Resolved ${summary.resolved} URLs`);
}
```

### Example 3: Cache Management

```javascript
async function manageCacheExample() {
  const resolver = new RedirectResolver();
  
  // Get cache info
  const info = await resolver.getCacheInfo();
  console.log(`Cache: ${info.validEntries} valid, ${info.expiredEntries} expired`);
  
  // Clean expired entries
  if (info.expiredEntries > 0) {
    const removed = await resolver.cleanExpiredCache();
    console.log(`Cleaned ${removed} entries`);
  }
  
  // Or clear entire cache
  // await resolver.clearCache();
}
```

### Example 4: Progress Tracking with UI

```javascript
async function resolveWithUI() {
  const resolver = new RedirectResolver();
  const bookmarks = await getBookmarks();
  
  const progressBar = document.getElementById('progress');
  const statusText = document.getElementById('status');
  
  const summary = await resolver.processBookmarks(bookmarks, (progress) => {
    progressBar.style.width = `${progress.percentage}%`;
    statusText.textContent = `Processing ${progress.completed}/${progress.total}...`;
  });
  
  statusText.textContent = `Complete! Updated ${summary.updated} bookmarks`;
}
```

## Console Output Examples

### Single URL Resolution

```
🔍 Resolving URL (attempt 1/4): https://bit.ly/example
✅ Successfully resolved: https://bit.ly/example
   ├─ Original URL: https://bit.ly/example
   ├─ Final URL: https://example.com/page
   └─ Redirect chain: https://bit.ly/example → https://example.com/page
💾 Cached result for: https://bit.ly/example
```

### Batch Processing

```
🚀 Starting batch URL resolution for 100 URLs
   ├─ Concurrent limit: 20
   ├─ Timeout per request: 10000ms
   └─ Max retries: 3

📦 Processing batch 1/5 (20 URLs)
✅ Batch 1 complete: 20/100 URLs processed

📦 Processing batch 2/5 (20 URLs)
✅ Batch 2 complete: 40/100 URLs processed

...

📊 Batch Resolution Summary:
   ├─ Total URLs: 100
   ├─ Resolved (changed): 45
   ├─ Unchanged: 50
   ├─ Failed: 5
   └─ Cache hits: 25
```

### Bookmark Update

```
🔖 Processing bookmark: "GitHub Repository"
   └─ URL: https://bit.ly/github-repo

✅ Bookmark updated successfully
   ├─ Original URL: https://bit.ly/github-repo
   ├─ Final URL: https://github.com/user/repository
   ├─ Redirect chain: https://bit.ly/github-repo → https://github.com/user/repository
   └─ Title preserved: "GitHub Repository"
```

## Testing

### Manual Testing

1. Open `test_redirect_resolver.html` in your browser
2. Load the extension with developer mode enabled
3. Run the test suite to verify functionality

### Integration Testing

See `examples/redirect_resolver_usage.js` for integration examples.

## Performance Considerations

- **Concurrent Processing**: Up to 20 URLs processed simultaneously
- **Caching**: Significantly reduces processing time for repeated URLs
- **Timeout**: 10-second timeout prevents hanging on unresponsive URLs
- **Retry Logic**: Exponential backoff prevents overwhelming servers

## Best Practices

1. **Use Progress Callbacks**: Provide user feedback during long operations
2. **Filter Bookmarks**: Only process URLs that likely need resolution
3. **Manage Cache**: Periodically clean expired entries
4. **Handle Errors**: Check `success` flag in results
5. **Monitor Statistics**: Use `getStats()` to track performance

## Troubleshooting

### URLs Not Resolving

- Check network connectivity
- Verify URL is accessible
- Check console for error messages
- URLs may be blocked by CORS

### Cache Issues

- Clear cache using `clearCache()`
- Check cache info with `getCacheInfo()`
- Expired entries are cleaned automatically

### Performance Issues

- Reduce `CONCURRENT_LIMIT` if experiencing timeouts
- Increase `REQUEST_TIMEOUT` for slow connections
- Filter bookmarks to process only necessary URLs

## Storage Usage

The service uses `chrome.storage.local` for:
- **Cache**: Resolved URL mappings (expires after 30 days)
- **Statistics**: Summary data from last run

Storage is automatically managed with:
- Automatic expiration of old entries
- Clean-up utilities
- Size optimization

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Chrome-based browsers (Edge, Brave, etc.)
- ❌ Firefox (requires Manifest V2 adaptation)

## License

Part of the BookmarkMind extension. See LICENSE file for details.
