import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getQuestionCount,
  setQuestionCount,
  getValidCounts,
  type QuestionCount,
} from "./question-count";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("question-count utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to successful state by default
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
  });

  describe("getValidCounts", () => {
    it("should return array of valid counts", () => {
      const counts = getValidCounts();
      expect(counts).toEqual([10, 20, 30]);
    });

    it("should return readonly array", () => {
      const counts = getValidCounts();
      expect(Object.isFrozen(counts) || Array.isArray(counts)).toBe(true);
    });
  });

  describe("getQuestionCount", () => {
    it("should return default (20) when nothing is saved", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const count = await getQuestionCount();
      expect(count).toBe(20);
    });

    it("should return saved count when valid", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("30");
      const count = await getQuestionCount();
      expect(count).toBe(30);
    });

    it("should return default when saved value is invalid", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("999");
      const count = await getQuestionCount();
      expect(count).toBe(20);
    });

    it("should return default when AsyncStorage throws error", async () => {
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(new Error("Storage error"));
      const count = await getQuestionCount();
      expect(count).toBe(20);
    });

    it("should handle all valid counts", async () => {
      for (const validCount of [10, 20, 30]) {
        vi.mocked(AsyncStorage.getItem).mockResolvedValue(validCount.toString());
        const count = await getQuestionCount();
        expect(count).toBe(validCount);
      }
    });
  });

  describe("setQuestionCount", () => {
    it("should save valid count to AsyncStorage", async () => {
      await setQuestionCount(20);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("yaya_math_question_count", "20");
    });

    it("should save all valid counts", async () => {
      for (const count of [10, 20, 30] as const) {
        vi.mocked(AsyncStorage.setItem).mockClear();
        await setQuestionCount(count);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("yaya_math_question_count", count.toString());
      }
    });

    it("should throw error for invalid count", async () => {
      await expect(setQuestionCount(999 as QuestionCount)).rejects.toThrow();
    });

    it("should throw error when AsyncStorage fails", async () => {
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error("Storage error"));
      await expect(setQuestionCount(20)).rejects.toThrow();
    });
  });

  describe("persistence flow", () => {
    it("should save and retrieve count in sequence", async () => {
      // Ensure mocks are in success state
      vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      // Save 30
      await setQuestionCount(30);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("yaya_math_question_count", "30");

      // Now mock getItem to return 30
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("30");
      const count = await getQuestionCount();
      expect(count).toBe(30);
    });

    it("should return default on first use", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const count = await getQuestionCount();
      expect(count).toBe(20);
    });
  });
});
