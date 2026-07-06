import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProblemStat {
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
  num1: number;
  num2: number;
  correctAnswer: number;
  userAnswer: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface OperationStats {
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  mostMissedProblems: Array<{
    num1: number;
    num2: number;
    correctAnswer: number;
    missCount: number;
    attemptCount: number;
  }>;
  numberRangeAnalysis: Array<{
    range: string;
    accuracy: number;
    attemptCount: number;
  }>;
}

export interface UserStats {
  totalSessions: number;
  totalProblems: number;
  totalCorrect: number;
  overallAccuracy: number;
  operationStats: {
    addition: OperationStats;
    subtraction: OperationStats;
    multiplication: OperationStats;
    division: OperationStats;
  };
  allProblems: ProblemStat[];
}

const STATS_KEY = 'yaya_user_stats';

export async function getUserStats(): Promise<UserStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (!data) {
      return getEmptyStats();
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[Stats] Failed to get stats:', error);
    return getEmptyStats();
  }
}

export async function recordSession(problems: ProblemStat[]): Promise<void> {
  try {
    const stats = await getUserStats();
    stats.totalSessions++;

    for (const problem of problems) {
      stats.allProblems.push(problem);
      stats.totalProblems++;
      if (problem.isCorrect) {
        stats.totalCorrect++;
      }
      updateOperationStats(stats, problem);
    }

    stats.overallAccuracy = Math.round((stats.totalCorrect / stats.totalProblems) * 100);

    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('[Stats] Failed to record session:', error);
  }
}

export async function getOperationStats(operation: 'addition' | 'subtraction' | 'multiplication' | 'division'): Promise<OperationStats> {
  try {
    const stats = await getUserStats();
    return stats.operationStats[operation];
  } catch (error) {
    console.error('[Stats] Failed to get operation stats:', error);
    return getEmptyOperationStats(operation);
  }
}

export async function clearStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STATS_KEY);
  } catch (error) {
    console.error('[Stats] Failed to clear stats:', error);
  }
}

function getEmptyStats(): UserStats {
  return {
    totalSessions: 0,
    totalProblems: 0,
    totalCorrect: 0,
    overallAccuracy: 0,
    operationStats: {
      addition: getEmptyOperationStats('addition'),
      subtraction: getEmptyOperationStats('subtraction'),
      multiplication: getEmptyOperationStats('multiplication'),
      division: getEmptyOperationStats('division'),
    },
    allProblems: [],
  };
}

function getEmptyOperationStats(operation: 'addition' | 'subtraction' | 'multiplication' | 'division'): OperationStats {
  return {
    operation,
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0,
    mostMissedProblems: [],
    numberRangeAnalysis: [
      { range: '1-10', accuracy: 0, attemptCount: 0 },
      { range: '11-20', accuracy: 0, attemptCount: 0 },
      { range: '21-30', accuracy: 0, attemptCount: 0 },
      { range: '31+', accuracy: 0, attemptCount: 0 },
    ],
  };
}

function updateOperationStats(stats: UserStats, problem: ProblemStat): void {
  const opStats = stats.operationStats[problem.operation];
  opStats.totalAttempts++;
  if (problem.isCorrect) {
    opStats.correctAttempts++;
  }
  opStats.accuracy = Math.round((opStats.correctAttempts / opStats.totalAttempts) * 100);

  if (!problem.isCorrect) {
    const existing = opStats.mostMissedProblems.find(
      (p) => p.num1 === problem.num1 && p.num2 === problem.num2 && p.correctAnswer === problem.correctAnswer
    );
    if (existing) {
      existing.missCount++;
      existing.attemptCount++;
    } else {
      opStats.mostMissedProblems.push({
        num1: problem.num1,
        num2: problem.num2,
        correctAnswer: problem.correctAnswer,
        missCount: 1,
        attemptCount: 1,
      });
    }
  } else {
    const existing = opStats.mostMissedProblems.find(
      (p) => p.num1 === problem.num1 && p.num2 === problem.num2 && p.correctAnswer === problem.correctAnswer
    );
    if (existing) {
      existing.attemptCount++;
    }
  }

  opStats.mostMissedProblems.sort((a, b) => b.missCount - a.missCount);
  opStats.mostMissedProblems = opStats.mostMissedProblems.slice(0, 10);

  const maxNum = Math.max(problem.num1, problem.num2);
  let rangeIndex = 0;
  if (maxNum <= 10) rangeIndex = 0;
  else if (maxNum <= 20) rangeIndex = 1;
  else if (maxNum <= 30) rangeIndex = 2;
  else rangeIndex = 3;

  const range = opStats.numberRangeAnalysis[rangeIndex];
  const prevCorrect = Math.round((range.accuracy / 100) * range.attemptCount) || 0;
  range.attemptCount++;
  if (problem.isCorrect) {
    range.accuracy = Math.round(((prevCorrect + 1) / range.attemptCount) * 100);
  } else {
    range.accuracy = Math.round((prevCorrect / range.attemptCount) * 100);
  }
}
