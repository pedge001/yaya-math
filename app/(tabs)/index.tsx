import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";
import { getShowResultsPreference, setShowResultsPreference } from "@/lib/show-results-storage";
import { getQuestionCount, setQuestionCount, getValidCounts, type QuestionCount } from "@/lib/question-count";
import { getStreakData, getStreakBadge } from "@/lib/streak-tracker";
import { getDailyChallengeState, getStreakState } from "@/lib/daily-challenge";

type Operation = "addition" | "subtraction" | "multiplication" | "division";
type Difficulty = "easy" | "medium" | "hard";

interface OperationCard {
  id: Operation;
  symbol: string;
  label: string;
}

const operations: OperationCard[] = [
  { id: "addition", symbol: "+", label: "Addition" },
  { id: "subtraction", symbol: "−", label: "Subtraction" },
  { id: "multiplication", symbol: "×", label: "Multiplication" },
  { id: "division", symbol: "÷", label: "Division" },
];

const difficultyLevels = [
  { id: "easy" as Difficulty, label: "Easy", range: "1-12" },
  { id: "medium" as Difficulty, label: "Medium", range: "1-20" },
  { id: "hard" as Difficulty, label: "Hard", range: "1-30" },
];

export default function OperationSelectionScreen() {
  const [selectedOperations, setSelectedOperations] = useState<Set<Operation>>(new Set());
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [questionCount, setQuestionCountState] = useState<QuestionCount>(20);
  const [streak, setStreak] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const colors = useThemeColors();
  const router = useRouter();

  // Load saved question count, streak, and Show Results preference on mount
  useEffect(() => {
    const loadSettings = async () => {
      const saved = await getQuestionCount();
      setQuestionCountState(saved);
      const streakData = await getStreakData();
      // Check if streak is still active (practiced today or yesterday)
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const isActive = streakData.lastPracticeDate === today || streakData.lastPracticeDate === yesterday;
      setStreak(isActive ? streakData.currentStreak : 0);
      // Load Show Results preference
      const showResultsEnabled = await getShowResultsPreference();
      setShowResults(showResultsEnabled);
      // Load daily challenge state
      const [dailyChallenge, dailyChallengeStreak] = await Promise.all([
        getDailyChallengeState(),
        getStreakState(),
      ]);
      setDailyCompleted(dailyChallenge.completed);
      setDailyStreak(dailyChallengeStreak.currentStreak);
    };
    loadSettings();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      padding: spacing.md,
      paddingBottom: spacing.sm,
    },
    header: {
      alignItems: 'center',
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    title: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: streak > 0 ? `${colors.warning}20` : colors.surface,
      borderWidth: 1,
      borderColor: streak > 0 ? colors.warning : colors.border,
    },
    streakText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: streak > 0 ? colors.warning : colors.muted,
      marginLeft: 4,
    },
    operationsContainer: {
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    operationsGrid: {
      gap: spacing.xs,
      width: '100%',
    },
    operationRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    operationCard: {
      flex: 1,
      height: 68,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    operationSymbol: {
      fontSize: 24,
      marginBottom: 2,
    },
    operationLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: colors.foreground,
    },
    speedModeContainer: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    showResultsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    showResultsCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    showResultsLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    speedModeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 2,
    },
    speedModeEmoji: {
      fontSize: fontSize.xl,
    },
    speedModeText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    difficultyContainer: {
      marginBottom: spacing.md,
    },
    difficultyLabel: {
      fontSize: fontSize.xs,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    difficultyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    difficultyButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
    },
    difficultyButtonText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    difficultyRange: {
      fontSize: fontSize.xs,
      color: colors.muted,
      textAlign: 'center',
    },
    questionCountContainer: {
      marginBottom: spacing.md,
    },
    questionCountLabel: {
      fontSize: fontSize.xs,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    questionCountRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    questionCountButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      minWidth: 60,
      alignItems: 'center',
    },
    questionCountButtonText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
    dailyChallengeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.xl,
      borderWidth: 1.5,
      marginBottom: spacing.sm,
    },
    startButton: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
    },
    startButtonText: {
      textAlign: 'center',
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
    },
  });

  const toggleOperation = (operation: Operation) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    setSelectedOperations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(operation)) {
        newSet.delete(operation);
      } else {
        newSet.add(operation);
      }
      return newSet;
    });
  };

  const startPractice = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSound("buttonPress");
    }
    const operationsParam = Array.from(selectedOperations).join(",");
    router.push(`/practice?operations=${operationsParam}&speedMode=${isSpeedMode}&showResults=${showResults}&difficulty=${difficulty}&questionCount=${questionCount}`);
  };

  const toggleSpeedMode = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound("buttonPress");
    }
    setIsSpeedMode(!isSpeedMode);
  };

  const toggleShowResults = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newValue = !showResults;
    setShowResults(newValue);
    await setShowResultsPreference(newValue);
  };

  const toggleDifficulty = (newDifficulty: Difficulty) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    setDifficulty(newDifficulty);
  };

  const selectQuestionCount = async (count: QuestionCount) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    setQuestionCountState(count);
    await setQuestionCount(count);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>YaYa Math</Text>
          <Text style={styles.subtitle}>Always Be Learning</Text>
          <View style={styles.streakContainer}>
            <Text style={{ fontSize: 16 }}>{streak > 0 ? getStreakBadge(streak) : "🌱"}</Text>
            <Text style={styles.streakText}>
              {streak > 0 ? `${streak} day streak!` : "Start your streak!"}
            </Text>
          </View>
        </View>

        {/* Operation Cards Grid */}
        <View style={styles.operationsContainer}>
          <View style={styles.operationsGrid}>
            <View style={styles.operationRow}>
              {operations.slice(0, 2).map((op) => {
                const isSelected = selectedOperations.has(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => toggleOperation(op.id)}
                    style={[
                      styles.operationCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[styles.operationSymbol, { color: colors.primary }]}>
                      {op.symbol}
                    </Text>
                    <Text style={styles.operationLabel}>{op.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.operationRow}>
              {operations.slice(2, 4).map((op) => {
                const isSelected = selectedOperations.has(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => toggleOperation(op.id)}
                    style={[
                      styles.operationCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[styles.operationSymbol, { color: colors.primary }]}>
                      {op.symbol}
                    </Text>
                    <Text style={styles.operationLabel}>{op.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Speed Mode Toggle */}
        <View style={styles.speedModeContainer}>
          <TouchableOpacity
            onPress={toggleSpeedMode}
            style={[
              styles.speedModeButton,
              {
                borderColor: isSpeedMode ? colors.primary : "rgba(182, 255, 251, 0.3)",
                backgroundColor: isSpeedMode ? "rgba(182, 255, 251, 0.1)" : "transparent",
              },
            ]}
          >
            <Text style={styles.speedModeEmoji}>⚡</Text>
            <Text
              style={[
                styles.speedModeText,
                { color: isSpeedMode ? colors.primary : colors.muted },
              ]}
            >
              Speed Mode {isSpeedMode ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
          {/* Show Results Checkbox */}
          <TouchableOpacity
            onPress={toggleShowResults}
            style={styles.showResultsRow}
          >
            <View
              style={[
                styles.showResultsCheckbox,
                {
                  borderColor: showResults ? colors.primary : colors.muted,
                  backgroundColor: showResults ? colors.primary : "transparent",
                },
              ]}
            >
              {showResults && (
                <Text style={{ color: "#000000", fontSize: 14, fontWeight: "700" }}>✓</Text>
              )}
            </View>
            <Text style={[styles.showResultsLabel, { color: showResults ? colors.primary : colors.muted }]}>
              Show Results
            </Text>
          </TouchableOpacity>
        </View>

        {/* Difficulty Level Selection */}
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyLabel}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {difficultyLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => toggleDifficulty(level.id)}
                style={[
                  styles.difficultyButton,
                  {
                    borderColor: difficulty === level.id ? colors.primary : colors.border,
                    backgroundColor: difficulty === level.id ? `${colors.primary}20` : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    { color: difficulty === level.id ? colors.primary : colors.muted },
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={styles.difficultyRange}>{level.range}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question Count Selection */}
        <View style={styles.questionCountContainer}>
          <Text style={styles.questionCountLabel}>Questions</Text>
          <View style={styles.questionCountRow}>
            {getValidCounts().map((count) => (
              <TouchableOpacity
                key={count}
                onPress={() => selectQuestionCount(count)}
                style={[
                  styles.questionCountButton,
                  {
                    borderColor: questionCount === count ? colors.primary : colors.border,
                    backgroundColor: questionCount === count ? `${colors.primary}20` : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.questionCountButtonText,
                    { color: questionCount === count ? colors.primary : colors.muted },
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily Challenge Button */}
        <TouchableOpacity
          onPress={() => router.push('/daily-challenge')}
          style={[
            styles.dailyChallengeButton,
            {
              borderColor: dailyCompleted ? colors.success : colors.primary,
              backgroundColor: dailyCompleted ? `${colors.success}15` : `${colors.primary}15`,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ fontSize: 20 }}>{dailyCompleted ? '\u2705' : '\u26a1'}</Text>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: dailyCompleted ? colors.success : colors.primary }}>
                {dailyCompleted ? 'Daily Challenge Done!' : 'Daily Challenge'}
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.muted }}>
                {dailyCompleted ? 'Come back tomorrow' : '10 mixed problems \u00b7 resets daily'}
              </Text>
            </View>
          </View>
          {dailyStreak > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14 }}>\ud83d\udd25</Text>
              <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.warning }}>{dailyStreak}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Start Button */}
        <TouchableOpacity
          onPress={startPractice}
          disabled={selectedOperations.size === 0}
          style={[
            styles.startButton,
            {
              backgroundColor: selectedOperations.size > 0 ? colors.primary : colors.border,
              opacity: selectedOperations.size > 0 ? 1 : 0.5,
            },
          ]}
        >
          <Text
            style={[
              styles.startButtonText,
              { color: selectedOperations.size > 0 ? "#000000" : colors.muted },
            ]}
          >
            Start Practice
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
