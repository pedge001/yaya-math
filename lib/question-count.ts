import AsyncStorage from "@react-native-async-storage/async-storage";

const QUESTION_COUNT_KEY = "yaya_math_question_count";
const DEFAULT_QUESTION_COUNT = 20;
const VALID_COUNTS = [10, 20, 30] as const;

export type QuestionCount = (typeof VALID_COUNTS)[number];

/**
 * Get the saved question count from AsyncStorage.
 * Returns the saved value or the default (20) if not set.
 */
export async function getQuestionCount(): Promise<QuestionCount> {
  try {
    const saved = await AsyncStorage.getItem(QUESTION_COUNT_KEY);
    if (saved && VALID_COUNTS.includes(parseInt(saved) as QuestionCount)) {
      return parseInt(saved) as QuestionCount;
    }
  } catch (error) {
    console.warn("[QuestionCount] Failed to get saved count:", error);
  }
  return DEFAULT_QUESTION_COUNT;
}

/**
 * Save the question count to AsyncStorage.
 */
export async function setQuestionCount(count: QuestionCount): Promise<void> {
  try {
    if (!VALID_COUNTS.includes(count)) {
      throw new Error(`Invalid question count: ${count}`);
    }
    await AsyncStorage.setItem(QUESTION_COUNT_KEY, count.toString());
  } catch (error) {
    console.error("[QuestionCount] Failed to save count:", error);
    throw error;
  }
}

/**
 * Get the list of valid question count options.
 */
export function getValidCounts(): readonly QuestionCount[] {
  return VALID_COUNTS;
}
