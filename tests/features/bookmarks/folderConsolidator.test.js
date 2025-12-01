import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Tests for FolderConsolidator class
 */

import fs from 'fs';
import path from 'path';

// Mock AnalyticsService
global.AnalyticsService = jest.fn().mockImplementation(() => ({
  recordConsolidation: jest.fn()
}));

// Load the FolderConsolidator class
const folderConsolidatorSource = fs.readFileSync(
  path.join(__dirname, '../../../extension/features/bookmarks/folderConsolidator.js'),
  'utf-8'
);
eval(folderConsolidatorSource);

describe('FolderConsolidator', () => {
  let folderConsolidator;

  beforeEach(() => {
    folderConsolidator = new FolderConsolidator();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(folderConsolidator.minBookmarksThreshold).toBe(3);
      expect(folderConsolidator.consolidationResults).toEqual({
        foldersProcessed: 0,
        bookmarksMoved: 0,
        foldersRemoved: 0,
        consolidationPaths: []
      });
    });

    test('should initialize analytics service if available', () => {
      expect(folderConsolidator.analyticsService).toBeTruthy();
    });
  });

  describe('_isSystemFolder', () => {
    test('should identify system folders correctly', () => {
      expect(folderConsolidator._isSystemFolder(null)).toBe(true);
      expect(folderConsolidator._isSystemFolder(undefined)).toBe(true);
      expect(folderConsolidator._isSystemFolder({ parentId: null })).toBe(true);
      expect(folderConsolidator._isSystemFolder({ title: 'Bookmarks Bar', parentId: '0' })).toBe(true);
      expect(folderConsolidator._isSystemFolder({ title: 'Other Bookmarks', parentId: '0' })).toBe(true);
      expect(folderConsolidator._isSystemFolder({ title: 'Mobile Bookmarks', parentId: '0' })).toBe(true);
      expect(folderConsolidator._isSystemFolder({ title: 'Recently Added', parentId: '0' })).toBe(true);
    });

    test('should not identify regular folders as system folders', () => {
      expect(folderConsolidator._isSystemFolder({ title: 'Work', parentId: '1' })).toBe(false);
      expect(folderConsolidator._isSystemFolder({ title: 'Personal', parentId: '2' })).toBe(false);
      expect(folderConsolidator._isSystemFolder({ title: 'Tech News', parentId: '3' })).toBe(false);
    });
  });

  describe('setMinBookmarksThreshold', () => {
    test('should update threshold with valid value', () => {
      folderConsolidator.setMinBookmarksThreshold(5);
      expect(folderConsolidator.minBookmarksThreshold).toBe(5);
    });

    test('should not update threshold with invalid value', () => {
      const originalThreshold = folderConsolidator.minBookmarksThreshold;
      folderConsolidator.setMinBookmarksThreshold(0);
      expect(folderConsolidator.minBookmarksThreshold).toBe(originalThreshold);
      
      folderConsolidator.setMinBookmarksThreshold(-1);
      expect(folderConsolidator.minBookmarksThreshold).toBe(originalThreshold);
    });
  });

  describe('_removeEmptyFolder', () => {
    test('should remove empty folder and update results', async () => {
      chrome.bookmarks.remove.resolves();

      await folderConsolidator._removeEmptyFolder('folder123', 'Empty Folder');

      expect(chrome.bookmarks.remove.calledWith('folder123')).toBe(true);
      expect(folderConsolidator.consolidationResults.foldersRemoved).toBe(1);
      expect(folderConsolidator.consolidationResults.consolidationPaths).toHaveLength(1);
      expect(folderConsolidator.consolidationResults.consolidationPaths[0]).toEqual({
        folderName: 'Empty Folder',
        bookmarkCount: 0,
        action: 'removed_empty'
      });
    });

    test('should handle removal errors gracefully', async () => {
      chrome.bookmarks.remove.rejects(new Error('Remove failed'));

      await folderConsolidator._removeEmptyFolder('folder123', 'Empty Folder');

      expect(chrome.bookmarks.remove.calledWith('folder123')).toBe(true);
      expect(folderConsolidator.consolidationResults.foldersRemoved).toBe(0);
    });
  });

  describe('consolidateSparsefolders', () => {
    test('should reset results before consolidation', async () => {
      // Set some initial values
      folderConsolidator.consolidationResults.foldersProcessed = 5;
      folderConsolidator.consolidationResults.bookmarksMoved = 10;

      chrome.bookmarks.getChildren.resolves([]);

      const result = await folderConsolidator.consolidateSparsefolders();

      expect(result.foldersProcessed).toBe(0);
      expect(result.bookmarksMoved).toBe(0);
    });

    test('should handle consolidation errors gracefully', async () => {
      chrome.bookmarks.getChildren.rejects(new Error('API Error'));

      // The method should complete without throwing, as errors are caught in _processFolder
      const result = await folderConsolidator.consolidateSparsefolders();
      
      expect(result.foldersProcessed).toBe(0);
      expect(result.bookmarksMoved).toBe(0);
      expect(result.foldersRemoved).toBe(0);
    });
  });
});