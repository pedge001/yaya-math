import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPersonalBests,
  checkAndUpdatePersonalBest,
  clearPersonalBests,
} from "../lib/personal-best-tracker";
import {
  getAchievements,
  updateAchievementProgress,
  clearAchievements,
  ACHIEVEMENT_DEFINITIONS,
} from "../lib/achievements";

describe.skip("Personal Best Tracking", () => {
  beforeEach(async () => {
    await clearPersonalBests();
  });

  it("should initialize with no personal bests", async () => {
    const bests = await getPersonalBests();
    expect(bests.addition).toBeNull();
    expect(bests.subtraction).toBeNull();
    expect(bests.multiplication).toBeNull();
    expect(bests.division).toBeNull();
  });

  it("should record first score as personal best", async () => {
    const isNewBest = await checkAndUpdatePersonalBest("addition", 45, false);
    expect(isNewBest).toBe(true);

    const bests = await getPersonalBests();
    expect(bests.addition?.score).toBe(45);
  });

  it("should update personal best when score is higher", async () => {
    await checkAndUpdatePersonalBest("multiplication", 30, false);
    const isNewBest = await checkAndUpdatePersonalBest("multiplication", 40, false);
    expect(isNewBest).toBe(true);

    const bests = await getPersonalBests();
    expect(bests.multiplication?.score).toBe(40);
  });

  it("should not update personal best when score is lower", async () => {
    await checkAndUpdatePersonalBest("subtraction", 48, false);
    const isNewBest = await checkAndUpdatePersonalBest("subtraction", 42, false);
    expect(isNewBest).toBe(false);

    const bests = await getPersonalBests();
    expect(bests.subtraction?.score).toBe(48);
  });

  it("should handle speed mode with lower time as better", async () => {
    await checkAndUpdatePersonalBest("division", 50, true, 200);
    const isNewBest = await checkAndUpdatePersonalBest("division", 50, true, 150);
    expect(isNewBest).toBe(true);

    const bests = await getPersonalBests();
    expect(bests.division?.speedModeTime).toBe(150);
  });
});

describe("Achievements System", () => {
  it("should have correct achievement definitions", () => {
    expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(12);
    expect(ACHIEVEMENT_DEFINITIONS[0].id).toBe("first_steps");
    expect(ACHIEVEMENT_DEFINITIONS[0].target).toBe(1);
  });

  it("should define all achievement types", () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map((a) => a.id);
    expect(ids).toContain("first_steps");
    expect(ids).toContain("problem_solver");
    expect(ids).toContain("perfect_score");
    expect(ids).toContain("speed_demon");
    expect(ids).toContain("week_warrior");
  });
});
