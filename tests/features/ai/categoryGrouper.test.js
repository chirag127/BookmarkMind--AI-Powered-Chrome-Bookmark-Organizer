import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { CategoryGrouper } from "../../../extension/features/ai/categoryGrouper.js";

describe("CategoryGrouper", () => {
    let grouper;

    beforeEach(() => {
        grouper = new CategoryGrouper();
    });

    test('should group "Adblocking" under "Privacy & Security"', () => {
        const result = grouper.getGroupedCategory("Adblocking");
        expect(result).toBe("Privacy & Security/Adblocking");
    });

    test('should group "Privacy" under "Privacy & Security"', () => {
        const result = grouper.getGroupedCategory("Privacy");
        expect(result).toBe("Privacy & Security/Privacy");
    });

    test('should group "VPN Services" under "Privacy & Security"', () => {
        const result = grouper.getGroupedCategory("VPN Services");
        expect(result).toBe("Privacy & Security/VPN Services");
    });

    test("should preserve existing hierarchy if grouped", () => {
        const result = grouper.getGroupedCategory("Adblocking/Tools");
        expect(result).toBe("Privacy & Security/Adblocking/Tools");
    });

    test("should not double group if already in the group", () => {
        const result = grouper.getGroupedCategory(
            "Privacy & Security/Adblocking"
        );
        expect(result).toBe("Privacy & Security/Adblocking");
    });

    test("should return original for unknown categories", () => {
        const result = grouper.getGroupedCategory("Random Stuff");
        expect(result).toBe("Random Stuff");
    });

    test("should handle empty input", () => {
        expect(grouper.getGroupedCategory("")).toBe("Uncategorized");
        expect(grouper.getGroupedCategory(null)).toBe("Uncategorized");
    });

    test('should group "Programming" under "Development"', () => {
        expect(grouper.getGroupedCategory("Programming")).toBe(
            "Development/Programming"
        );
    });
});
