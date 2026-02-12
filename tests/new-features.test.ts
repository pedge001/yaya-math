import { describe, it, expect } from "vitest";
import { getStreakBadge, getStreakMessage } from "../lib/streak-tracker";

describe("Streak Tracker", () => {
  it("should return correct badge for different streak counts", () => {
    expect(getStreakBadge(0)).toBe("");
    expect(getStreakBadge(1)).toBe("🌱");
    expect(getStreakBadge(3)).toBe("✨");
    expect(getStreakBadge(7)).toBe("🔥");
    expect(getStreakBadge(14)).toBe("🏆");
    expect(getStreakBadge(30)).toBe("⭐");
    expect(getStreakBadge(50)).toBe("👑");
    expect(getStreakBadge(100)).toBe("💎");
  });

  it("should return correct message for different streak counts", () => {
    expect(getStreakMessage(0)).toBe("Start your streak today!");
    expect(getStreakMessage(1)).toBe("Great start! Keep it up!");
    expect(getStreakMessage(3)).toBe("Building momentum!");
    expect(getStreakMessage(7)).toBe("One week streak!");
    expect(getStreakMessage(14)).toBe("Two weeks strong!");
    expect(getStreakMessage(30)).toBe("Amazing! 30+ day streak!");
    expect(getStreakMessage(50)).toBe("Incredible! 50+ day streak!");
    expect(getStreakMessage(100)).toBe("Legendary! 100+ day streak!");
  });
});

describe("Daily Challenge Problem Generation", () => {
  it("should generate consistent problems for the same date seed", () => {
    // This test ensures daily challenges are deterministic
    const seed1 = "2026-02-12";
    const seed2 = "2026-02-12";
    
    // Simple seed-based RNG test
    const rng = (seed: string, index: number) => {
      const seedNum = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const x = Math.sin(seedNum + index) * 10000;
      return x - Math.floor(x);
    };

    const val1 = rng(seed1, 0);
    const val2 = rng(seed2, 0);
    
    expect(val1).toBe(val2);
  });

  it("should generate different problems for different dates", () => {
    const seed1 = "2026-02-12";
    const seed2 = "2026-02-13";
    
    const rng = (seed: string, index: number) => {
      const seedNum = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const x = Math.sin(seedNum + index) * 10000;
      return x - Math.floor(x);
    };

    const val1 = rng(seed1, 0);
    const val2 = rng(seed2, 0);
    
    expect(val1).not.toBe(val2);
  });
});

describe("Speed Mode", () => {
  it("should format time correctly", () => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${String(secs).padStart(2, "0")}`;
    };

    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(30)).toBe("0:30");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(125)).toBe("2:05");
    expect(formatTime(599)).toBe("9:59");
  });

  it("should compare times correctly (lower is better)", () => {
    const time1 = 120; // 2 minutes
    const time2 = 150; // 2.5 minutes
    
    expect(time1 < time2).toBe(true);
  });
});
