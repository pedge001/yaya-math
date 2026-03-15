import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";
import { getQuestionCount, setQuestionCount, getValidCounts, type QuestionCount } from "@/lib/question-count";

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
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [questionCount, setQuestionCountState] = useState<QuestionCount>(20);
  const colors = useThemeColors();
  const router = useRouter();

  // Load saved question count on mount
  useEffect(() => {
    const loadQuestionCount = async () => {
      const saved = await getQuestionCount();
      setQuestionCountState(saved);
    };
    loadQuestionCount();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      padding: spacing.md,
    },
    header: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
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
    operationsContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    operationsGrid: {
      gap: spacing.md,
    },
    operationRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    operationCard: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    operationSymbol: {
      fontSize: 48,
      marginBottom: spacing.xs,
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
    router.push(`/practice?operations=${operationsParam}&speedMode=${isSpeedMode}&difficulty=${difficulty}&questionCount=${questionCount}`);
  };

  const toggleSpeedMode = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound("buttonPress");
    }
    setIsSpeedMode(!isSpeedMode);
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
