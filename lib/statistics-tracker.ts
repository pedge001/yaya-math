import AsyncStorage from "@react-native-async-storage/async-storage";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

export interface SessionStats {
  id: string;
  date: string;
  operation: Operation;
  totalProblems: number;
  correctAnswers: number;
  accuracy: number; // percentage
  completionTime?: number; // seconds
  isSpeedMode: boolean;
}

export interface OperationStats {
  operation: Operation;
  totalSessions: number;
  averageAccuracy: number;
  averageTime: number;
  totalProblems: number;
  totalCorrect: number;
  recentSessions: SessionStats[];
}

export interface ImprovementTrend {
  date: string;
  accuracy: number;
  averageTime?: number;
}

const STATS_KEY = "math_practice_statistics";
const MAX_SESSIONS = 100; // Keep last 100 sessions

/**
 * Get all session statistics
 */
export async function getAllSessionStats(): Promise<SessionStats[]> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load statistics:", error);
  }
  return [];
}

/**
 * Save a new session
 */
export async function saveSession(
  operation: Operation,
  totalProblems: number,
  correctAnswers: number,
  completionTime?: number,
  isSpeedMode: boolean = false
): Promise<void> {
  const sessions = await getAllSessionStats();

  const newSession: SessionStats = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    operation,
    totalProblems,
    correctAnswers,
    accuracy: Math.round((correctAnswers / totalProblems) * 100),
    completionTime,
    isSpeedMode,
  };

  // Add new session and keep only last MAX_SESSIONS
  sessions.unshift(newSession);
  const trimmedSessions = sessions.slice(0, MAX_SESSIONS);

  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(trimmedSessions));
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

/**
 * Get statistics for a specific operation
 */
export async function getOperationStats(operation: Operation): Promise<OperationStats> {
  const sessions = await getAllSessionStats();
  const operationSessions = sessions.filter((s) => s.operation === operation);

  if (operationSessions.length === 0) {
    return {
      operation,
      totalSessions: 0,
      averageAccuracy: 0,
      averageTime: 0,
      totalProblems: 0,
      totalCorrect: 0,
      recentSessions: [],
    };
  }

  const totalProblems = operationSessions.reduce((sum, s) => sum + s.totalProblems, 0);
  const totalCorrect = operationSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const averageAccuracy = (totalCorrect / totalProblems) * 100;

  const sessionsWithTime = operationSessions.filter((s) => s.completionTime !== undefined);
  const averageTime =
    sessionsWithTime.length > 0
      ? sessionsWithTime.reduce((sum, s) => sum + (s.completionTime || 0), 0) / sessionsWithTime.length
      : 0;

  return {
    operation,
    totalSessions: operationSessions.length,
    averageAccuracy: Math.round(averageAccuracy),
    averageTime: Math.round(averageTime),
    totalProblems,
    totalCorrect,
    recentSessions: operationSessions.slice(0, 10),
  };
}

/**
 * Get improvement trends for the past N days
 */
export async function getImprovementTrends(operation: Operation, days: number = 7): Promise<ImprovementTrend[]> {
  const sessions = await getAllSessionStats();
  const operationSessions = sessions.filter((s) => s.operation === operation);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentSessions = operationSessions.filter((s) => new Date(s.date) >= cutoffDate);

  // Group by date
  const sessionsByDate = new Map<string, SessionStats[]>();
  recentSessions.forEach((session) => {
    const dateKey = new Date(session.date).toISOString().split("T")[0];
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  });

  // Calculate daily averages
  const trends: ImprovementTrend[] = [];
  sessionsByDate.forEach((daySessions, date) => {
    const totalCorrect = daySessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalProblems = daySessions.reduce((sum, s) => sum + s.totalProblems, 0);
    const accuracy = Math.round((totalCorrect / totalProblems) * 100);

    const sessionsWithTime = daySessions.filter((s) => s.completionTime !== undefined);
    const averageTime =
      sessionsWithTime.length > 0
        ? Math.round(sessionsWithTime.reduce((sum, s) => sum + (s.completionTime || 0), 0) / sessionsWithTime.length)
        : undefined;

    trends.push({ date, accuracy, averageTime });
  });

  // Sort by date
  trends.sort((a, b) => a.date.localeCompare(b.date));

  return trends;
}

/**
 * Get overall statistics across all operations
 */
export async function getOverallStats() {
  const sessions = await getAllSessionStats();

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalProblems: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      averageTime: 0,
    };
  }

  const totalProblems = sessions.reduce((sum, s) => sum + s.totalProblems, 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
  const overallAccuracy = Math.round((totalCorrect / totalProblems) * 100);

  const sessionsWithTime = sessions.filter((s) => s.completionTime !== undefined);
  const averageTime =
    sessionsWithTime.length > 0
      ? Math.round(sessionsWithTime.reduce((sum, s) => sum + (s.completionTime || 0), 0) / sessionsWithTime.length)
      : 0;

  return {
    totalSessions: sessions.length,
    totalProblems,
    totalCorrect,
    overallAccuracy,
    averageTime,
  };
}

/**
 * Clear all statistics (for testing or reset)
 */
export async function clearStatistics(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STATS_KEY);
  } catch (error) {
    console.error("Failed to clear statistics:", error);
  }
}
