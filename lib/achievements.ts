import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string; // Emoji
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number; // Current progress
  target?: number; // Target to unlock
}

export interface AchievementProgress {
  totalProblemsCompleted: number;
  perfectScores: number;
  speedRecordsUnder3Min: number;
  currentStreak: number;
  maxStreak: number;
}

const ACHIEVEMENTS_KEY = "math_practice_achievements";
const PROGRESS_KEY = "math_practice_achievement_progress";

// Define all achievements
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedDate" | "progress">[] = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Complete your first practice session",
    badge: "👶",
    target: 1,
  },
  {
    id: "problem_solver",
    title: "Problem Solver",
    description: "Solve 100 problems",
    badge: "🧠",
    target: 100,
  },
  {
    id: "math_master",
    title: "Math Master",
    description: "Solve 500 problems",
    badge: "🎓",
    target: 500,
  },
  {
    id: "calculator",
    title: "Human Calculator",
    description: "Solve 1000 problems",
    badge: "🤖",
    target: 1000,
  },
  {
    id: "perfect_score",
    title: "Perfect Score",
    description: "Get 100% on a practice session",
    badge: "💯",
    target: 1,
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Get 10 perfect scores",
    badge: "⭐",
    target: 10,
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Complete 50 problems in under 3 minutes",
    badge: "⚡",
    target: 1,
  },
  {
    id: "lightning_fast",
    title: "Lightning Fast",
    description: "Complete 5 speed runs under 3 minutes",
    badge: "🌩️",
    target: 5,
  },
  {
    id: "dedicated",
    title: "Dedicated",
    description: "Practice for 3 days in a row",
    badge: "🔥",
    target: 3,
  },
  {
    id: "week_warrior",
    title: "Week Warrior",
    description: "Practice for 7 days in a row",
    badge: "🏆",
    target: 7,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Practice for 30 days in a row",
    badge: "👑",
    target: 30,
  },
  {
    id: "legend",
    title: "Legend",
    description: "Practice for 100 days in a row",
    badge: "💎",
    target: 100,
  },
];

/**
 * Get all achievements with unlock status and current progress
 */
export async function getAchievements(): Promise<Achievement[]> {
  let savedAchievements: Achievement[] | null = null;
  
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      savedAchievements = JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load achievements:", error);
  }

  // Get current progress to update progress values
  const progress = await getAchievementProgress();

  // If we have saved achievements, update their progress
  if (savedAchievements) {
    savedAchievements.forEach((achievement) => {
      if (!achievement.unlocked) {
        switch (achievement.id) {
          case "first_steps":
            achievement.progress = progress.totalProblemsCompleted > 0 ? 1 : 0;
            break;
          case "problem_solver":
          case "math_master":
          case "calculator":
            achievement.progress = progress.totalProblemsCompleted;
            break;
          case "perfect_score":
          case "perfectionist":
            achievement.progress = progress.perfectScores;
            break;
          case "speed_demon":
          case "lightning_fast":
            achievement.progress = progress.speedRecordsUnder3Min;
            break;
          case "dedicated":
          case "week_warrior":
          case "unstoppable":
          case "legend":
            achievement.progress = progress.maxStreak;
            break;
        }
      }
    });
    return savedAchievements;
  }

  // Return default achievements (all locked)
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: false,
    progress: 0,
  }));
}

/**
 * Get achievement progress data
 */
export async function getAchievementProgress(): Promise<AchievementProgress> {
  try {
    const data = await AsyncStorage.getItem(PROGRESS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load achievement progress:", error);
  }

  return {
    totalProblemsCompleted: 0,
    perfectScores: 0,
    speedRecordsUnder3Min: 0,
    currentStreak: 0,
    maxStreak: 0,
  };
}

/**
 * Update achievement progress and check for unlocks
 * Returns array of newly unlocked achievement IDs
 */
export async function updateAchievementProgress(
  problemsCompleted: number,
  isPerfectScore: boolean,
  isSpeedRecordUnder3Min: boolean,
  currentStreak: number
): Promise<string[]> {
  const progress = await getAchievementProgress();
  const achievements = await getAchievements();

  // Update progress
  progress.totalProblemsCompleted += problemsCompleted;
  if (isPerfectScore) {
    progress.perfectScores += 1;
  }
  if (isSpeedRecordUnder3Min) {
    progress.speedRecordsUnder3Min += 1;
  }
  progress.currentStreak = currentStreak;
  progress.maxStreak = Math.max(progress.maxStreak, currentStreak);

  // Save progress first
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save achievement progress:", error);
  }

  // Check for unlocks
  const newlyUnlocked: string[] = [];

  achievements.forEach((achievement) => {
    if (achievement.unlocked) return;

    let shouldUnlock = false;
    let currentProgress = 0;

    switch (achievement.id) {
      case "first_steps":
        currentProgress = progress.totalProblemsCompleted > 0 ? 1 : 0;
        shouldUnlock = progress.totalProblemsCompleted >= 50;
        break;
      case "problem_solver":
        currentProgress = progress.totalProblemsCompleted;
        shouldUnlock = progress.totalProblemsCompleted >= 100;
        break;
      case "math_master":
        currentProgress = progress.totalProblemsCompleted;
        shouldUnlock = progress.totalProblemsCompleted >= 500;
        break;
      case "calculator":
        currentProgress = progress.totalProblemsCompleted;
        shouldUnlock = progress.totalProblemsCompleted >= 1000;
        break;
      case "perfect_score":
        currentProgress = progress.perfectScores;
        shouldUnlock = progress.perfectScores >= 1;
        break;
      case "perfectionist":
        currentProgress = progress.perfectScores;
        shouldUnlock = progress.perfectScores >= 10;
        break;
      case "speed_demon":
        currentProgress = progress.speedRecordsUnder3Min;
        shouldUnlock = progress.speedRecordsUnder3Min >= 1;
        break;
      case "lightning_fast":
        currentProgress = progress.speedRecordsUnder3Min;
        shouldUnlock = progress.speedRecordsUnder3Min >= 5;
        break;
      case "dedicated":
        currentProgress = progress.maxStreak;
        shouldUnlock = progress.maxStreak >= 3;
        break;
      case "week_warrior":
        currentProgress = progress.maxStreak;
        shouldUnlock = progress.maxStreak >= 7;
        break;
      case "unstoppable":
        currentProgress = progress.maxStreak;
        shouldUnlock = progress.maxStreak >= 30;
        break;
      case "legend":
        currentProgress = progress.maxStreak;
        shouldUnlock = progress.maxStreak >= 100;
        break;
    }

    achievement.progress = currentProgress;

    if (shouldUnlock) {
      achievement.unlocked = true;
      achievement.unlockedDate = new Date().toISOString();
      newlyUnlocked.push(achievement.id);
    }
  });

  // Save updated achievements
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch (error) {
    console.error("Failed to save achievement progress:", error);
  }

  return newlyUnlocked;
}

/**
 * Get unlocked achievements count
 */
export async function getUnlockedCount(): Promise<number> {
  const achievements = await getAchievements();
  return achievements.filter((a) => a.unlocked).length;
}

/**
 * Clear all achievements (for testing or reset)
 */
export async function clearAchievements(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.error("Failed to clear achievements:", error);
  }
}
