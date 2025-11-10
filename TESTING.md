# BookmarkMind Testing Documentation

## Overview

BookmarkMind now includes a comprehensive automated testing suite to ensure code quality and prevent regressions. The test suite covers unit tests, integration tests, and end-to-end workflow tests.

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on changes)
npm run test:watch
```

## Test Suite Structure

### 1. Unit Tests - AI Categorization Logic (`aiProcessor.test.js`)

**Status**: ✅ 33/33 tests passing

Tests the core AI processing logic including:
- Model initialization and API key configuration
- Gemini model fallback mechanism (7 models with automatic failover)
- Folder name normalization and formatting
- Technical term corrections (JavaScript, GitHub, Node.js, etc.)
- Brand name standardization
- Edge case handling (special characters, unicode, long names)

**Example Tests**:
```javascript
✓ should initialize with default values
✓ should switch to next model on failure
✓ should detect camelCase
✓ should preserve acronyms (AI, API, UI)
✓ should handle null or empty input
```

### 2. Integration Tests - Chrome Bookmarks API (`bookmarkService.test.js`)

Tests Chrome extension API interactions:
- Bookmark retrieval and tree traversal
- Folder creation in hierarchical structures
- Bookmark movement between folders
- Path parsing (supports both "/" and " > " separators)
- Statistics calculation (total, categorized, uncategorized)
- Error handling for API failures

**Key Test Scenarios**:
- Creating nested folder hierarchies (e.g., "Work > Projects > Active")
- Reusing existing folders to avoid duplicates
- Moving bookmarks with position index
- Handling malformed or missing bookmark data

### 3. Integration Tests - Folder Management (`folderManager.test.js`)

Tests folder operations and caching:
- Category folder creation and management
- Multi-level folder hierarchy creation
- Folder caching for performance
- Bulk bookmark movement operations
- Empty folder cleanup
- Folder structure export
- Error recovery and graceful degradation

**Key Features Tested**:
- Cache hit/miss scenarios
- Concurrent folder operations
- Export to JSON format
- Recursive empty folder removal

### 4. End-to-End Tests - Complete Workflow (`categorizer.e2e.test.js`)

Tests the complete bookmark organization process:
- Full categorization workflow from uncategorized to organized
- Multi-bookmark batch processing
- Hierarchical folder creation in real scenarios
- Existing folder detection and reuse
- Error handling during full workflow
- Statistics tracking throughout process
- Edge cases: empty lists, special characters, very long paths

**Workflow Test Scenarios**:
```javascript
✓ should complete full workflow from bookmarks to organized folders
✓ should handle hierarchical folder creation
✓ should reuse existing folders
✓ should handle bookmark move failures gracefully
✓ should track categories used
✓ should handle special characters in category names
```

## Test Coverage

Current test coverage:
- **Unit Tests**: 33 tests covering AI processing logic
- **Integration Tests**: 65 tests covering Chrome API and folder management
- **Total**: 98 comprehensive tests

Coverage report available via:
```bash
npm run test:coverage
# Opens coverage/index.html
```

## Chrome API Mocking

The test suite uses `sinon-chrome` to mock Chrome extension APIs:

```javascript
// All Chrome APIs are automatically mocked
chrome.bookmarks.create()  // Returns Promise
chrome.bookmarks.move()    // Returns Promise
chrome.bookmarks.getTree() // Returns Promise
chrome.storage.sync.get()  // Returns Promise
```

All mocks are Promise-based (not callback-based) for modern async/await testing.

## Writing Tests

### Unit Test Example
```javascript
describe('AIProcessor', () => {
  test('should normalize folder names', () => {
    const processor = new AIProcessor();
    const result = processor.normalizeFolderName('javascript');
    expect(result).toBe('JavaScript');
  });
});
```

### Integration Test Example
```javascript
test('should create hierarchical folders', async () => {
  const service = new BookmarkService();
  const folderId = await service.findOrCreateFolderByPath('Work > Projects > Active');
  
  expect(folderId).toBeDefined();
  expect(chrome.bookmarks.create.called).toBe(true);
});
```

### E2E Test Example
```javascript
test('should complete full categorization workflow', async () => {
  // Setup mock data
  chrome.bookmarks.getTree.resolves([mockBookmarkTree]);
  
  // Execute workflow
  const results = await categorizer.categorizeAllBookmarks();
  
  // Verify results
  expect(results.categorized).toBeGreaterThan(0);
  expect(results.errors).toBe(0);
});
```

## Test Utilities

Global test helpers available in all tests:

```javascript
// Create mock bookmark
const bookmark = createMockBookmark('id', 'Title', 'https://example.com', 'parentId');

// Create mock folder
const folder = createMockFolder('id', 'Folder Name', 'parentId');

// Mock HTTP responses
mockFetch({ data: 'response' }, 200);
```

## Running Specific Tests

```bash
# Run single test file
npm test -- tests/aiProcessor.test.js

# Run specific test by name
npm test -- -t "should normalize folder names"

# Run with verbose output
npm test -- --verbose

# Run in watch mode
npm test -- --watch
```

## Debugging Tests

```bash
# Run with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

## Best Practices

1. **Test Isolation**: Each test should be completely independent
2. **Clear Naming**: Use descriptive names that explain the test purpose
3. **Arrange-Act-Assert**: Structure tests with setup, execution, verification
4. **Mock External APIs**: Always mock Chrome APIs and network calls
5. **Test Edge Cases**: Include error conditions and boundary cases
6. **Keep Tests Fast**: Unit tests should complete in milliseconds
7. **Async/Await**: Use modern async patterns for all async operations

## Troubleshooting

### Common Issues

**Problem**: Tests fail with "stub expected to yield"
**Solution**: Chrome APIs now use Promises, not callbacks. Use `chrome.method.resolves()` not `.yields()`

**Problem**: Tests timeout
**Solution**: Increase timeout in `jest.config.js` or ensure all Promises resolve

**Problem**: Coverage not generated
**Solution**: Check that source files are in `scripts/` directory and run with `--coverage` flag

## Future Enhancements

Planned testing improvements:
- [ ] Visual regression testing for popup UI
- [ ] Performance benchmarking tests
- [ ] Load testing with large bookmark collections
- [ ] Cross-browser testing (Edge, Brave, Opera)
- [ ] Accessibility testing
- [ ] Security testing for API key handling

## Resources

- [Jest Documentation](https://jestjs.io/)
- [sinon-chrome GitHub](https://github.com/acvetkov/sinon-chrome)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For issues or questions about the test suite:
1. Check the test output for specific error messages
2. Review the test file source code for examples
3. Consult the Jest documentation for assertion syntax
4. Open an issue on GitHub with test failure details

---

**Test Suite Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: BookmarkMind Development Team
