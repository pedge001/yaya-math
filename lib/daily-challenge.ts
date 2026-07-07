import AsyncStorage from "@react-native-async-storage/async-storage";

const DAILY_CHALLENGE_KEY = "daily_challenge_state";
const STREAK_KEY = "daily_challenge_streak";

export type Operation = "addition" | "subtraction" | "multiplication" | "division";

export interface DailyProblem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

export interface DailyStreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  totalChallengesCompleted: number;
  badges: string[]; // e.g. ["streak_3", "streak_7", "streak_30", "perfect_score"]
}

export interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  problems: DailyProblem[];
  completed: boolean;
  score: number | null; // 0-10
  completedAt: number | null; // timestamp
}

/** Get today's date string in YYYY-MM-DD (local time) */
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Simple seeded pseudo-random number generator (mulberry32) */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a YYYY-MM-DD string to a numeric seed */
function dateSeed(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

/** Generate today's 10 fixed problems from the date seed */
export function generateDailyProblems(dateStr: string): DailyProblem[] {
  const rng = seededRandom(dateSeed(dateStr));
  const operations: Operation[] = ["addition", "subtraction", "multiplication", "division"];
  const problems: DailyProblem[] = [];

  for (let i = 0; i < 10; i++) {
    const opIdx = Math.floor(rng() * 4);
    const operation = operations[opIdx];
    let num1: number, num2: number, answer: number;

    switch (operation) {
      case "addition":
        num1 = Math.floor(rng() * 20) + 1;
        num2 = Math.floor(rng() * 20) + 1;
        answer = num1 + num2;
        break;
      case "subtraction":
        num1 = Math.floor(rng() * 20) + 5;
        num2 = Math.floor(rng() * num1) + 1;
        answer = num1 - num2;
        break;
      case "multiplication":
        num1 = Math.floor(rng() * 12) + 1;
        num2 = Math.floor(rng() * 12) + 1;
        answer = num1 * num2;
        break;
      case "division":
        num2 = Math.floor(rng() * 11) + 2; // divisor 2-12
        num1 = num2 * (Math.floor(rng() * 10) + 1); // ensure whole number
        answer = num1 / num2;
        break;
    }

    problems.push({ num1, num2, operation, answer });
  }

  return problems;
}

/** Load today's challenge state (creates fresh if new day) */
export async function getDailyChallengeState(): Promise<DailyChallengeState> {
  try {
    const today = getTodayString();
    const raw = await AsyncStorage.getItem(DAILY_CHALLENGE_KEY);
    if (raw) {
      const state: DailyChallengeState = JSON.parse(raw);
      if (state.date === today) return state;
    }
    // New day — generate fresh problems
    const fresh: DailyChallengeState = {
      date: today,
      problems: generateDailyProblems(today),
      completed: false,
      score: null,
      completedAt: null,
    };
    await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    const today = getTodayString();
    return {
      date: today,
      problems: generateDailyProblems(today),
      completed: false,
      score: null,
      completedAt: null,
    };
  }
}

/** Mark today's challenge as completed with a score */
export async function completeDailyChallenge(score: number): Promise<DailyStreakState> {
  const today = getTodayString();

  // Update challenge state
  const challenge = await getDailyChallengeState();
  challenge.completed = true;
  challenge.score = score;
  challenge.completedAt = Date.now();
  await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(challenge));

  // Update streak
  const streak = await getStreakState();
  const yesterday = getYesterdayString();

  if (streak.lastCompletedDate === today) {
    // Already completed today — no change to streak
    return streak;
  }

  if (streak.lastCompletedDate === yesterday) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastCompletedDate = today;
  streak.totalChallengesCompleted += 1;

  // Award badges
  const newBadges: string[] = [];
  if (streak.currentStreak === 3 && !streak.badges.includes("streak_3")) newBadges.push("streak_3");
  if (streak.currentStreak === 7 && !streak.badges.includes("streak_7")) newBadges.push("streak_7");
  if (streak.currentStreak === 14 && !streak.badges.includes("streak_14")) newBadges.push("streak_14");
  if (streak.currentStreak === 30 && !streak.badges.includes("streak_30")) newBadges.push("streak_30");
  if (score === 10 && !streak.badges.includes("perfect_score")) newBadges.push("perfect_score");
  if (streak.totalChallengesCompleted === 1 && !streak.badges.includes("first_challenge")) newBadges.push("first_challenge");

  streak.badges = [...streak.badges, ...newBadges];
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));

  return streak;
}

export async function getStreakState(): Promise<DailyStreakState> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    totalChallengesCompleted: 0,
    badges: [],
  };
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const BADGE_INFO: Record<string, { label: string; emoji: string; description: string }> = {
  first_challenge: { label: "First Challenge", emoji: "🌟", description: "Completed your first daily challenge!" },
  streak_3: { label: "3-Day Streak", emoji: "🔥", description: "3 days in a row!" },
  streak_7: { label: "Week Warrior", emoji: "⚡", description: "7 days in a row!" },
  streak_14: { label: "Two-Week Titan", emoji: "💪", description: "14 days in a row!" },
  streak_30: { label: "Monthly Master", emoji: "🏆", description: "30 days in a row!" },
  perfect_score: { label: "Perfect Score", emoji: "💯", description: "10 out of 10 on a daily challenge!" },
};
