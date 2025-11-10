# BookmarkMind Test Suite

Comprehensive automated testing suite for the BookmarkMind Chrome extension.

## Overview

This test suite provides:
- **Unit Tests**: Test individual components and their logic in isolation
- **Integration Tests**: Test Chrome API interactions and service integrations  
- **End-to-End Tests**: Test complete workflows from start to finish

## Test Structure

```
tests/
├── setup.js                    # Jest configuration and Chrome API mocks
├── aiProcessor.test.js         # Unit tests for AI categorization logic ✅
├── bookmarkService.test.js     # Integration tests for bookmark operations
├── folderManager.test.js       # Integration tests for folder management
└── categorizer.e2e.test.js     # End-to-end workflow tests
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# AI Processor unit tests (PASSING)
npm test -- tests/aiProcessor.test.js

# Bookmark Service integration tests
npm test -- tests/bookmarkService.test.js

# Folder Manager integration tests
npm test -- tests/folderManager.test.js

# End-to-end tests
npm test -- tests/categorizer.e2e.test.js

# Watch mode (re-runs tests on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Coverage

### ✅ Unit Tests (aiProcessor.test.js) - PASSING (33/33 tests)
- AI Processor initialization and configuration
- Gemini model fallback mechanism  
- Folder name normalization logic
- Category name formatting (camelCase, Title Case, etc.)
- Technical term and brand name corrections
- Edge cases: special characters, unicode, long names

### Integration Tests (bookmarkService.test.js)
- Bookmark retrieval from Chrome API
- Folder creation and hierarchy management
- Bookmark movement between folders
- Hierarchical path parsing and creation
- Error handling for Chrome API failures
- Bookmark statistics calculation

### Integration Tests (folderManager.test.js)
- Category folder creation
- Multi-level folder hierarchies
- Folder caching mechanism
- Bulk bookmark movement operations
- Empty folder cleanup
- Folder structure export
- Error recovery

### End-to-End Tests (categorizer.e2e.test.js)
- Complete categorization workflow
- Multi-bookmark organization
- Hierarchical folder creation in real scenarios
- Existing folder reuse
- Error handling during full workflow
- Statistics tracking
- Edge cases: empty lists, special characters, long paths
- Concurrent operations

## Test Utilities

The test suite provides several utilities in `setup.js`:

### Mock Functions
```javascript
// Create mock bookmark
const bookmark = createMockBookmark('id', 'Title', 'https://example.com', 'parentId');

// Create mock folder
const folder = createMockFolder('id', 'Folder Name', 'parentId');

// Mock fetch responses
mockFetch({ data: 'response' }, 200);
```

### Chrome API Mocks
All Chrome APIs are automatically mocked with Promise-based returns:
- `chrome.bookmarks.*` - Returns Promises
- `chrome.storage.*` - Returns Promises
- `chrome.runtime.*` - Returns Promises

## Writing New Tests

### Adding Unit Tests
```javascript
describe('MyComponent', () => {
  test('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Testing Chrome API Interactions
```javascript
test('should create bookmark', async () => {
  const result = await myService.createBookmark('Test', 'https://example.com');
  
  expect(chrome.bookmarks.create.calledOnce).toBe(true);
  expect(result.title).toBe('Test');
});
```

### Testing Async Operations
```javascript
test('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## Current Status

### ✅ Passing Tests (52/98)
- All AI Processor unit tests (33 tests)
- Core initialization tests
- Basic helper method tests

### 🔄 In Progress (46 tests)
Some integration and E2E tests need adjustments for:
- Chrome API callback/Promise compatibility
- Mock configuration for complex scenarios
- Async timing in test scenarios

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Coverage Goals

- **Unit Tests**: >90% coverage of logic functions ✅
- **Integration Tests**: Cover all Chrome API interactions  
- **E2E Tests**: Cover main user workflows and edge cases

View coverage report after running:
```bash
npm run test:coverage
```

Then open `coverage/index.html` in your browser.

## Debugging Tests

### Run Single Test File
```bash
npx jest tests/aiProcessor.test.js
```

### Run Single Test Case
```bash
npx jest -t "should normalize folder names"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Names**: Use descriptive test names that explain what is being tested
3. **Arrange-Act-Assert**: Structure tests with setup, execution, and verification
4. **Mock External Dependencies**: Always mock Chrome APIs and network calls
5. **Test Edge Cases**: Include tests for error conditions and boundary cases
6. **Keep Tests Fast**: Unit tests should run in milliseconds
7. **Use async/await**: All Chrome API interactions are Promise-based

## Troubleshooting

### Tests Fail Due to Chrome API
- Ensure `sinon-chrome` is properly installed
- Check that `setup.js` is loaded before tests  
- Verify Chrome API mocks return Promises (not callbacks)
- Use `chrome.bookmarks.method.resolves()` not `.yields()`

### Tests Timeout
- Increase timeout in `jest.config.js`
- Check for unresolved promises
- Ensure async/await is used correctly

### Coverage Not Generated
- Ensure source files are in `scripts/` directory
- Check `collectCoverageFrom` in `jest.config.js`
- Run with `--coverage` flag explicitly

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Maintain or improve coverage percentage
4. Update this README if adding new test utilities

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [sinon-chrome Documentation](https://github.com/acvetkov/sinon-chrome)
- [Chrome Extensions API Reference](https://developer.chrome.com/docs/extensions/reference/)
- [Testing Async Code](https://jestjs.io/docs/asynchronous)
