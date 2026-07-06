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

import { getStreakData, updateStreak, getStreakBadge, getStreakMessage } from "./streak-tracker";

describe("Streak Tracker", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("returns default streak data when no data exists", async () => {
    const data = await getStreakData();
    expect(data.currentStreak).toBe(0);
    expect(data.lastPracticeDate).toBe("");
    expect(data.longestStreak).toBe(0);
  });

  it("starts streak at 1 on first practice", async () => {
    const data = await updateStreak();
    expect(data.currentStreak).toBe(1);
    expect(data.lastPracticeDate).not.toBe("");
    expect(data.longestStreak).toBe(1);
  });

  it("does not increment streak if already practiced today", async () => {
    const first = await updateStreak();
    expect(first.currentStreak).toBe(1);

    const second = await updateStreak();
    expect(second.currentStreak).toBe(1);
  });

  it("increments streak on consecutive day", async () => {
    // Simulate yesterday's practice
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const streakData = {
      currentStreak: 5,
      lastPracticeDate: yesterdayStr,
      longestStreak: 5,
    };
    mockStorage["@math_practice_streak"] = JSON.stringify(streakData);
    mockStorage["@math_practice_last_date"] = yesterdayStr;

    const result = await updateStreak();
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
  });

  it("resets streak after missing a day", async () => {
    // Simulate 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

    const streakData = {
      currentStreak: 10,
      lastPracticeDate: twoDaysAgoStr,
      longestStreak: 10,
    };
    mockStorage["@math_practice_streak"] = JSON.stringify(streakData);
    mockStorage["@math_practice_last_date"] = twoDaysAgoStr;

    const result = await updateStreak();
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10); // Longest preserved
  });

  it("preserves longest streak even after reset", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

    const streakData = {
      currentStreak: 3,
      lastPracticeDate: twoDaysAgoStr,
      longestStreak: 50,
    };
    mockStorage["@math_practice_streak"] = JSON.stringify(streakData);
    mockStorage["@math_practice_last_date"] = twoDaysAgoStr;

    const result = await updateStreak();
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(50);
  });
});

describe("Streak Badge", () => {
  it("returns empty string for 0 streak", () => {
    expect(getStreakBadge(0)).toBe("");
  });

  it("returns seedling for streak 1-2", () => {
    expect(getStreakBadge(1)).toBe("🌱");
    expect(getStreakBadge(2)).toBe("🌱");
  });

  it("returns sparkles for streak 3-6", () => {
    expect(getStreakBadge(3)).toBe("✨");
    expect(getStreakBadge(6)).toBe("✨");
  });

  it("returns fire for streak 7-13", () => {
    expect(getStreakBadge(7)).toBe("🔥");
    expect(getStreakBadge(13)).toBe("🔥");
  });

  it("returns trophy for streak 14-29", () => {
    expect(getStreakBadge(14)).toBe("🏆");
    expect(getStreakBadge(29)).toBe("🏆");
  });

  it("returns star for streak 30-49", () => {
    expect(getStreakBadge(30)).toBe("⭐");
    expect(getStreakBadge(49)).toBe("⭐");
  });

  it("returns crown for streak 50-99", () => {
    expect(getStreakBadge(50)).toBe("👑");
    expect(getStreakBadge(99)).toBe("👑");
  });

  it("returns diamond for streak 100+", () => {
    expect(getStreakBadge(100)).toBe("💎");
    expect(getStreakBadge(365)).toBe("💎");
  });
});

describe("Streak Message", () => {
  it("returns start message for 0 streak", () => {
    expect(getStreakMessage(0)).toBe("Start your streak today!");
  });

  it("returns great start for 1 day", () => {
    expect(getStreakMessage(1)).toBe("Great start! Keep it up!");
  });

  it("returns building momentum for 3-6 days", () => {
    expect(getStreakMessage(3)).toBe("Building momentum!");
  });

  it("returns one week for 7-13 days", () => {
    expect(getStreakMessage(7)).toBe("One week streak!");
  });
});
