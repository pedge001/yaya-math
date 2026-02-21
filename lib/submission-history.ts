import AsyncStorage from "@react-native-async-storage/async-storage";

const SUBMISSION_HISTORY_KEY = "submission_history";

export interface SubmissionEntry {
  id: string;
  initials: string;
  score: number;
  totalProblems: number;
  operation: "addition" | "subtraction" | "multiplication" | "division";
  difficulty: "easy" | "medium" | "hard";
  timestamp: number;
  mode?: "practice" | "speed";
  completionTime?: number; // for speed mode
}

/**
 * Get all submission history entries
 */
export async function getSubmissionHistory(): Promise<SubmissionEntry[]> {
  try {
    const data = await AsyncStorage.getItem(SUBMISSION_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to get submission history:", error);
    return [];
  }
}

/**
 * Add a new submission to history
 */
export async function addSubmissionToHistory(entry: Omit<SubmissionEntry, "id" | "timestamp">): Promise<void> {
  try {
    const history = await getSubmissionHistory();
    const newEntry: SubmissionEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    // Add to beginning of array (most recent first)
    history.unshift(newEntry);
    
    // Keep only last 50 submissions
    const trimmedHistory = history.slice(0, 50);
    
    await AsyncStorage.setItem(SUBMISSION_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to add submission to history:", error);
  }
}

/**
 * Clear all submission history
 */
export async function clearSubmissionHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SUBMISSION_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear submission history:", error);
  }
}

/**
 * Get submission history filtered by operation
 */
export async function getSubmissionHistoryByOperation(
  operation: "addition" | "subtraction" | "multiplication" | "division"
): Promise<SubmissionEntry[]> {
  const history = await getSubmissionHistory();
  return history.filter((entry) => entry.operation === operation);
}

/**
 * Get submission history filtered by difficulty
 */
export async function getSubmissionHistoryByDifficulty(
  difficulty: "easy" | "medium" | "hard"
): Promise<SubmissionEntry[]> {
  const history = await getSubmissionHistory();
  return history.filter((entry) => entry.difficulty === difficulty);
}
