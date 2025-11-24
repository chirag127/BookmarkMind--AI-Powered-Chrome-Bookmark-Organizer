module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'extension/scripts/**/*.js',
    'extension/popup/**/*.js',
    'extension/options/**/*.js',
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
  testTimeout: 10000
};
