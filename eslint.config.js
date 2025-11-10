const globals = require('globals');

module.exports = [
    {
        files: ['scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                chrome: 'readonly',
                importScripts: 'readonly',
                AIProcessor: 'readonly',
                AnalyticsService: 'readonly',
                BookmarkService: 'readonly',
                Categorizer: 'readonly',
                FolderManager: 'readonly',
                LearningService: 'readonly',
                SnapshotManager: 'readonly'
            }
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'error'
        }
    }
];
