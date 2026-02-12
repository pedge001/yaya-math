import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "@math_practice_streak";
const LAST_PRACTICE_KEY = "@math_practice_last_date";

export interface StreakData {
  currentStreak: number;
  lastPracticeDate: string; // YYYY-MM-DD format
  longestStreak: number;
}

/**
 * Get the current streak data
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const streakStr = await AsyncStorage.getItem(STREAK_KEY);
    const lastDateStr = await AsyncStorage.getItem(LAST_PRACTICE_KEY);

    if (!streakStr || !lastDateStr) {
      return { currentStreak: 0, lastPracticeDate: "", longestStreak: 0 };
    }

    const data: StreakData = JSON.parse(streakStr);
    return data;
  } catch (error) {
    console.error("Failed to get streak data:", error);
    return { currentStreak: 0, lastPracticeDate: "", longestStreak: 0 };
  }
}

/**
 * Update streak after completing a practice session or daily challenge
 */
export async function updateStreak(): Promise<StreakData> {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const currentData = await getStreakData();

    // If already practiced today, don't update
    if (currentData.lastPracticeDate === today) {
      return currentData;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak: number;

    if (currentData.lastPracticeDate === yesterdayStr) {
      // Consecutive day - increment streak
      newStreak = currentData.currentStreak + 1;
    } else if (currentData.lastPracticeDate === "") {
      // First time practicing
      newStreak = 1;
    } else {
      // Streak broken - restart
      newStreak = 1;
    }

    const newLongestStreak = Math.max(newStreak, currentData.longestStreak);

    const updatedData: StreakData = {
      currentStreak: newStreak,
      lastPracticeDate: today,
      longestStreak: newLongestStreak,
    };

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updatedData));
    await AsyncStorage.setItem(LAST_PRACTICE_KEY, today);

    return updatedData;
  } catch (error) {
    console.error("Failed to update streak:", error);
    return { currentStreak: 0, lastPracticeDate: "", longestStreak: 0 };
  }
}

/**
 * Get streak badge emoji based on streak count
 */
export function getStreakBadge(streak: number): string {
  if (streak === 0) return "";
  if (streak >= 100) return "💎"; // Diamond
  if (streak >= 50) return "👑"; // Crown
  if (streak >= 30) return "⭐"; // Star
  if (streak >= 14) return "🏆"; // Trophy
  if (streak >= 7) return "🔥"; // Fire
  if (streak >= 3) return "✨"; // Sparkles
  return "🌱"; // Seedling
}

/**
 * Get streak message based on streak count
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Keep it up!";
  if (streak >= 100) return "Legendary! 100+ day streak!";
  if (streak >= 50) return "Incredible! 50+ day streak!";
  if (streak >= 30) return "Amazing! 30+ day streak!";
  if (streak >= 14) return "Two weeks strong!";
  if (streak >= 7) return "One week streak!";
  if (streak >= 3) return "Building momentum!";
  return `${streak} day streak!`;
}
