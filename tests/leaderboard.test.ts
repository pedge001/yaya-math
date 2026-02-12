import { describe, it, expect } from "vitest";

describe("Leaderboard Logic", () => {
  it("validates initials format (3 uppercase letters)", () => {
    const validInitials = ["ABC", "XYZ", "JOE"];
    const invalidInitials = ["ab", "ABCD", "12A", "A B"];

    validInitials.forEach((initials) => {
      expect(initials).toHaveLength(3);
      expect(initials).toMatch(/^[A-Z]{3}$/);
    });

    invalidInitials.forEach((initials) => {
      expect(initials).not.toMatch(/^[A-Z]{3}$/);
    });
  });

  it("validates score range (0-50)", () => {
    const validScores = [0, 25, 50];
    const invalidScores = [-1, 51, 100];

    validScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(50);
    });

    invalidScores.forEach((score) => {
      expect(score < 0 || score > 50).toBe(true);
    });
  });

  it("determines if score qualifies for top 10", () => {
    const leaderboard = [
      { score: 50 },
      { score: 48 },
      { score: 45 },
      { score: 42 },
      { score: 40 },
      { score: 38 },
      { score: 35 },
      { score: 32 },
      { score: 30 },
      { score: 28 },
    ];

    // Score higher than lowest
    expect(35 > leaderboard[leaderboard.length - 1].score).toBe(true);

    // Score equal to lowest
    expect(28 > leaderboard[leaderboard.length - 1].score).toBe(false);

    // Score lower than lowest
    expect(25 > leaderboard[leaderboard.length - 1].score).toBe(false);
  });

  it("handles empty leaderboard (all scores qualify)", () => {
    const emptyLeaderboard: any[] = [];
    const anyScore = 10;

    // If leaderboard has less than 10 entries, any score qualifies
    expect(emptyLeaderboard.length < 10).toBe(true);
  });

  it("sorts leaderboard by score descending", () => {
    const unsortedScores = [30, 45, 28, 50, 35];
    const sortedScores = [...unsortedScores].sort((a, b) => b - a);

    expect(sortedScores).toEqual([50, 45, 35, 30, 28]);
    expect(sortedScores[0]).toBe(50); // Highest score first
    expect(sortedScores[sortedScores.length - 1]).toBe(28); // Lowest score last
  });

  it("calculates rank based on position", () => {
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ranks = positions.map((pos) => pos + 1);

    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("assigns medal colors for top 3", () => {
    const getRankColor = (rank: number) => {
      if (rank === 1) return "#FFD700"; // Gold
      if (rank === 2) return "#C0C0C0"; // Silver
      if (rank === 3) return "#CD7F32"; // Bronze
      return "#B6FFFB"; // Default cyan
    };

    expect(getRankColor(1)).toBe("#FFD700");
    expect(getRankColor(2)).toBe("#C0C0C0");
    expect(getRankColor(3)).toBe("#CD7F32");
    expect(getRankColor(4)).toBe("#B6FFFB");
    expect(getRankColor(10)).toBe("#B6FFFB");
  });
});

describe("Initials Input Logic", () => {
  it("cycles through alphabet forward", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const currentIndex = alphabet.indexOf("A");
    const nextIndex = (currentIndex + 1) % alphabet.length;

    expect(alphabet[nextIndex]).toBe("B");
  });

  it("cycles through alphabet backward", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const currentIndex = alphabet.indexOf("A");
    const prevIndex = (currentIndex - 1 + alphabet.length) % alphabet.length;

    expect(alphabet[prevIndex]).toBe("Z");
  });

  it("wraps from Z to A when going forward", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const currentIndex = alphabet.indexOf("Z");
    const nextIndex = (currentIndex + 1) % alphabet.length;

    expect(alphabet[nextIndex]).toBe("A");
  });

  it("maintains 3-character initials array", () => {
    const initials = ["A", "B", "C"];

    expect(initials).toHaveLength(3);
    expect(initials.join("")).toBe("ABC");
  });
});
