import AsyncStorage from "@react-native-async-storage/async-storage";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

export interface PersonalBest {
  score: number;
  date: string;
  speedModeTime?: number; // For speed mode, lower is better
}

export interface PersonalBests {
  addition: PersonalBest | null;
  subtraction: PersonalBest | null;
  multiplication: PersonalBest | null;
  division: PersonalBest | null;
}

const STORAGE_KEY = "math_practice_personal_bests";

/**
 * Get all personal bests from storage
 */
export async function getPersonalBests(): Promise<PersonalBests> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load personal bests:", error);
  }

  return {
    addition: null,
    subtraction: null,
    multiplication: null,
    division: null,
  };
}

/**
 * Get personal best for a specific operation
 */
export async function getPersonalBest(operation: Operation): Promise<PersonalBest | null> {
  const bests = await getPersonalBests();
  return bests[operation];
}

/**
 * Check if a score is a new personal best and update if so
 * Returns true if it's a new personal best
 */
export async function checkAndUpdatePersonalBest(
  operation: Operation,
  score: number,
  isSpeedMode: boolean = false,
  speedModeTime?: number
): Promise<boolean> {
  const bests = await getPersonalBests();
  const currentBest = bests[operation];

  let isNewBest = false;

  if (isSpeedMode && speedModeTime !== undefined) {
    // For speed mode, lower time is better
    if (!currentBest || !currentBest.speedModeTime || speedModeTime < currentBest.speedModeTime) {
      isNewBest = true;
    }
  } else {
    // For regular mode, higher score is better
    if (!currentBest || score > currentBest.score) {
      isNewBest = true;
    }
  }

  if (isNewBest) {
    bests[operation] = {
      score,
      date: new Date().toISOString(),
      speedModeTime: isSpeedMode ? speedModeTime : undefined,
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bests));
    } catch (error) {
      console.error("Failed to save personal best:", error);
    }
  }

  return isNewBest;
}

/**
 * Clear all personal bests (for testing or reset)
 */
export async function clearPersonalBests(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear personal bests:", error);
  }
}
