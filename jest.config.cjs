module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'extension/features/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  globals: {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder
  },
  testTimeout: 10000,
  transform: {} // Disable transformation to support ES modules natively
};
