import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import { getSubmissionHistory, addSubmissionToHistory } from "../lib/submission-history";

describe("Personal Best Badge - User Initials", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("returns empty array when no submissions exist", async () => {
    const history = await getSubmissionHistory();
    expect(history).toEqual([]);
  });

  it("stores and retrieves initials from submission history", async () => {
    await addSubmissionToHistory({
      initials: "ZAP",
      score: 8,
      totalProblems: 10,
      operation: "addition",
      difficulty: "easy",
      mode: "practice",
    });

    const history = await getSubmissionHistory();
    expect(history.length).toBe(1);
    expect(history[0].initials).toBe("ZAP");
  });

  it("most recent submission is first in history", async () => {
    await addSubmissionToHistory({
      initials: "AAA",
      score: 5,
      totalProblems: 10,
      operation: "addition",
      difficulty: "easy",
    });

    await addSubmissionToHistory({
      initials: "ZAP",
      score: 8,
      totalProblems: 10,
      operation: "addition",
      difficulty: "easy",
    });

    const history = await getSubmissionHistory();
    expect(history[0].initials).toBe("ZAP");
  });

  it("badge matching is case-sensitive", async () => {
    await addSubmissionToHistory({
      initials: "ZAP",
      score: 8,
      totalProblems: 10,
      operation: "addition",
      difficulty: "easy",
    });

    const history = await getSubmissionHistory();
    const userInitials = history[0].initials;

    // Leaderboard entry matching
    expect(userInitials === "ZAP").toBe(true);
    expect(userInitials === "zap").toBe(false);
  });

  it("speed mode submissions are stored with completionTime", async () => {
    await addSubmissionToHistory({
      initials: "BOB",
      score: 10,
      totalProblems: 10,
      operation: "multiplication",
      difficulty: "hard",
      mode: "speed",
      completionTime: 45,
    });

    const history = await getSubmissionHistory();
    expect(history[0].initials).toBe("BOB");
    expect(history[0].mode).toBe("speed");
    expect(history[0].completionTime).toBe(45);
  });
});
