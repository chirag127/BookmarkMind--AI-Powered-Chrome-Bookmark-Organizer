import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Unit Tests - AI Processor
 * Tests for AI categorization logic
 */

import fs from 'fs';
import path from 'path';

// Load the actual source file
const aiProcessorSource = fs.readFileSync(
  path.join(__dirname, '../../../extension/features/ai/aiProcessor.js'),
  'utf-8'
);

// Execute in global context to define the class
eval(aiProcessorSource);

describe('AIProcessor', () => {
  let aiProcessor;

  beforeEach(() => {
    aiProcessor = new AIProcessor();
    aiProcessor.setApiKey('test_api_key');
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      const processor = new AIProcessor();
      expect(processor.apiKey).toBeNull();
      expect(processor.currentModelIndex).toBe(0);
      expect(processor.geminiModels.length).toBeGreaterThan(0);
    });

    test('should set API key correctly', () => {
      const processor = new AIProcessor();
      processor.setApiKey('test_key', 'agent_key');
      expect(processor.apiKey).toBe('test_key');
      expect(processor.agentRouterApiKey).toBe('agent_key');
    });
  });

  describe('Model Fallback', () => {
    test('should start with first model', () => {
      expect(aiProcessor.getCurrentModelName()).toBe('gemini-2.5-pro');
    });

    test('should switch to next model on failure', () => {
      const firstModel = aiProcessor.getCurrentModelName();
      const hasNext = aiProcessor.tryNextGeminiModel();
      expect(hasNext).toBe(true);
      expect(aiProcessor.getCurrentModelName()).not.toBe(firstModel);
    });

    test('should return false when models exhausted', () => {
      // Exhaust all models
      while (aiProcessor.currentModelIndex < aiProcessor.geminiModels.length - 1) {
        aiProcessor.tryNextGeminiModel();
      }
      const hasNext = aiProcessor.tryNextGeminiModel();
      expect(hasNext).toBe(false);
    });

    test('should reset to first model', () => {
      aiProcessor.tryNextGeminiModel();
      aiProcessor.tryNextGeminiModel();
      aiProcessor.resetToFirstModel();
      expect(aiProcessor.currentModelIndex).toBe(0);
      expect(aiProcessor.getCurrentModelName()).toBe('gemini-2.5-pro');
    });
  });

  describe('Folder Name Normalization', () => {
    test('should identify need for lowercase folder name fixes', () => {
      // Function only fixes names that clearly need improvement
      const result1 = aiProcessor._isWellFormatted('javascript');
      const result2 = aiProcessor._isWellFormatted('web development');
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    test('should identify need for uppercase folder name fixes', () => {
      expect(aiProcessor._isWellFormatted('WEB DEVELOPMENT')).toBe(false);
      expect(aiProcessor._isWellFormatted('PROGRAMMING')).toBe(false);
    });

    test('should preserve acronyms', () => {
      expect(aiProcessor.normalizeFolderName('AI')).toBe('AI');
      expect(aiProcessor.normalizeFolderName('API')).toBe('API');
      expect(aiProcessor.normalizeFolderName('UI')).toBe('UI');
    });

    test('should have technical term fixes available', () => {
      const result = aiProcessor._fixCommonTerms('javascript tutorials');
      expect(result).toContain('JavaScript');
    });

    test('should clean up spacing in names', () => {
      const result = aiProcessor._cleanupSpacing('  web   development  ');
      expect(result).toBe('web development');
    });

    test('should detect camelCase', () => {
      expect(aiProcessor._isCamelCase('webDevelopment')).toBe(true);
      expect(aiProcessor._isCamelCase('reactTutorials')).toBe(true);
    });

    test('should leave well-formatted names unchanged', () => {
      expect(aiProcessor.normalizeFolderName('JavaScript')).toBe('JavaScript');
      expect(aiProcessor.normalizeFolderName('Web Development')).toBe('Web Development');
      expect(aiProcessor.normalizeFolderName('API Documentation')).toBe('API Documentation');
    });

    test('should handle null or empty input', () => {
      expect(aiProcessor.normalizeFolderName('')).toBe('');
      expect(aiProcessor.normalizeFolderName(null)).toBe(null);
      expect(aiProcessor.normalizeFolderName(undefined)).toBe(undefined);
    });

    test('should have brand name fixes available', () => {
      const result = aiProcessor._fixCommonTerms('github resources');
      expect(result).toContain('GitHub');
    });
  });

  describe('Categorization Logic', () => {
    test('should require API key for categorization', async () => {
      const processor = new AIProcessor();
      await expect(processor.categorizeBookmarks([], [], {}))
        .rejects.toThrow('API key not set');
    });

    test('should return empty results for empty bookmarks', async () => {
      const result = await aiProcessor.categorizeBookmarks([], [], {});
      expect(result).toEqual({ categories: [], results: [] });
    });

    test('should handle null or undefined bookmarks', async () => {
      const result1 = await aiProcessor.categorizeBookmarks(null, [], {});
      expect(result1).toEqual({ categories: [], results: [] });

      const result2 = await aiProcessor.categorizeBookmarks(undefined, [], {});
      expect(result2).toEqual({ categories: [], results: [] });
    });
  });

  describe('Helper Methods', () => {
    describe('_isWellFormatted', () => {
      test('should identify well-formatted names', () => {
        expect(aiProcessor._isWellFormatted('JavaScript')).toBe(true);
        expect(aiProcessor._isWellFormatted('Web Development')).toBe(true);
        expect(aiProcessor._isWellFormatted('AI')).toBe(true);
      });

      test('should identify poorly formatted names', () => {
        expect(aiProcessor._isWellFormatted('javascript')).toBe(false);
        expect(aiProcessor._isWellFormatted('WEB DEVELOPMENT')).toBe(false);
        expect(aiProcessor._isWellFormatted('webDevelopment')).toBe(false);
      });
    });

    describe('_isCamelCase', () => {
      test('should detect camelCase', () => {
        expect(aiProcessor._isCamelCase('webDevelopment')).toBe(true);
        expect(aiProcessor._isCamelCase('reactTutorials')).toBe(true);
      });

      test('should not detect non-camelCase', () => {
        expect(aiProcessor._isCamelCase('Web Development')).toBe(false);
        expect(aiProcessor._isCamelCase('javascript')).toBe(false);
        expect(aiProcessor._isCamelCase('JAVASCRIPT')).toBe(false);
      });
    });

    describe('_toTitleCase', () => {
      test('should convert to title case', () => {
        expect(aiProcessor._toTitleCase('web development')).toBe('Web Development');
        expect(aiProcessor._toTitleCase('javascript tutorials')).toBe('Javascript Tutorials');
      });

      test('should handle small words', () => {
        expect(aiProcessor._toTitleCase('a guide to web development')).toBe('A Guide to Web Development');
      });
    });

    describe('_camelToTitleCase', () => {
      test('should convert camelCase to Title Case', () => {
        expect(aiProcessor._camelToTitleCase('webDevelopment')).toBe('Web Development');
        expect(aiProcessor._camelToTitleCase('reactTutorials')).toBe('React Tutorials');
        expect(aiProcessor._camelToTitleCase('javaScriptBasics')).toBe('Java Script Basics');
      });
    });

    describe('_isProperNoun', () => {
      test('should identify proper nouns', () => {
        expect(aiProcessor._isProperNoun('Google')).toBe(true);
        expect(aiProcessor._isProperNoun('Microsoft')).toBe(true);
        expect(aiProcessor._isProperNoun('Apple')).toBe(true);
      });

      test('should not identify common words as proper nouns', () => {
        expect(aiProcessor._isProperNoun('development')).toBe(false);
        expect(aiProcessor._isProperNoun('programming')).toBe(false);
      });
    });
  });

  describe('URL Building', () => {
    test('should build correct Gemini API URL', () => {
      const url = aiProcessor.getCurrentModelUrl();
      expect(url).toContain('generativelanguage.googleapis.com');
      expect(url).toContain('gemini-2.5-pro');
      expect(url).toContain(':generateContent');
    });

    test('should update URL when model changes', () => {
      const url1 = aiProcessor.getCurrentModelUrl();
      aiProcessor.tryNextGeminiModel();
      const url2 = aiProcessor.getCurrentModelUrl();
      expect(url1).not.toBe(url2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in folder names', () => {
      expect(aiProcessor.normalizeFolderName('C++ Programming')).toBe('C++ Programming');
      expect(aiProcessor.normalizeFolderName('R&D Projects')).toBe('R&D Projects');
    });

    test('should handle numbers in folder names', () => {
      // Function preserves well-formatted names with numbers
      expect(aiProcessor.normalizeFolderName('Web3 Development')).toBe('Web3 Development');
      expect(aiProcessor.normalizeFolderName('HTML5 Tutorials')).toBe('HTML5 Tutorials');
    });

    test('should handle emoji and unicode', () => {
      const name = '🚀 Projects';
      const result = aiProcessor.normalizeFolderName(name);
      expect(result).toContain('Projects');
    });

    test('should handle very long folder names', () => {
      const longName = 'A Very Long Folder Name That Should Still Be Normalized Correctly';
      const result = aiProcessor.normalizeFolderName(longName);
      expect(result).toBe(longName);
    });
  });
});
