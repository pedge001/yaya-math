import AsyncStorage from '@react-native-async-storage/async-storage';

const SHOW_RESULTS_KEY = 'yaya_show_results_enabled';

/**
 * Get the saved Show Results preference
 */
export async function getShowResultsPreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SHOW_RESULTS_KEY);
    return value === 'true';
  } catch (error) {
    console.error('[ShowResults] Failed to get preference:', error);
    return false;
  }
}

/**
 * Save the Show Results preference
 */
export async function setShowResultsPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOW_RESULTS_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('[ShowResults] Failed to save preference:', error);
  }
}
