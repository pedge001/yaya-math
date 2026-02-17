import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { trpc } from "@/lib/trpc";
import { playSound } from "@/lib/sound-manager";

type Operation = "addition" | "subtraction" | "multiplication" | "division";
type Difficulty = "easy" | "medium" | "hard";

const operations: { id: Operation; label: string; symbol: string }[] = [
  { id: "addition", label: "Addition", symbol: "+" },
  { id: "subtraction", label: "Subtraction", symbol: "−" },
  { id: "multiplication", label: "Multiplication", symbol: "×" },
  { id: "division", label: "Division", symbol: "÷" },
];

export default function LeaderboardScreen() {
  const [selectedOperation, setSelectedOperation] = useState<Operation>("addition");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.bold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.base,
      color: colors.muted,
    },
    modeToggleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    modeToggleButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
    modeToggleText: {
      textAlign: 'center',
      fontWeight: fontWeight.bold,
    },
    difficultyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    difficultyButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    difficultyText: {
      textAlign: 'center',
      fontWeight: fontWeight.semibold,
      fontSize: fontSize.sm,
    },
    operationRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    operationButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
    operationText: {
      textAlign: 'center',
      fontWeight: fontWeight.bold,
      fontSize: fontSize.lg,
    },
    scrollView: {
      flex: 1,
    },
    leaderboardList: {
      gap: spacing.md,
    },
    leaderboardEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    entryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    medalText: {
      fontSize: 24,
      width: 32,
      textAlign: 'center',
    },
    initialsText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.foreground,
    },
    dateText: {
      fontSize: fontSize.xs,
      color: colors.muted,
    },
    scoreText: {
      fontSize: 24,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyStateText: {
      fontSize: fontSize.lg,
      color: colors.muted,
    },
    emptyStateSubtext: {
      fontSize: fontSize.sm,
      color: colors.muted,
      marginTop: spacing.sm,
    },
  });

  const { data: leaderboardData } = trpc.leaderboard.getTop10.useQuery(
    { operation: selectedOperation, difficulty: selectedDifficulty },
    { enabled: !isSpeedMode }
  );
  const { data: speedLeaderboardData } = trpc.speedLeaderboard.getTop10.useQuery(
    { operation: selectedOperation, difficulty: selectedDifficulty },
    { enabled: isSpeedMode }
  );

  const currentData = isSpeedMode ? speedLeaderboardData : leaderboardData;
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>Top Scores</Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              setIsSpeedMode(false);
            }}
            style={[
              styles.modeToggleButton,
              {
                backgroundColor: !isSpeedMode ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.modeToggleText,
                {
                  color: !isSpeedMode ? "#000000" : colors.foreground,
                },
              ]}
            >
              Score
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              setIsSpeedMode(true);
            }}
            style={[
              styles.modeToggleButton,
              {
                backgroundColor: isSpeedMode ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.modeToggleText,
                {
                  color: isSpeedMode ? "#000000" : colors.foreground,
                },
              ]}
            >
              Speed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Difficulty Tabs */}
        <View style={styles.difficultyRow}>
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
            <TouchableOpacity
              key={diff}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  playSound("buttonPress");
                }
                setSelectedDifficulty(diff);
              }}
              style={[
                styles.difficultyButton,
                {
                  backgroundColor: selectedDifficulty === diff ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  {
                    color: selectedDifficulty === diff ? "#000000" : colors.foreground,
                  },
                ]}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Operation Tabs */}
        <View style={styles.operationRow}>
          {operations.map((op) => (
            <TouchableOpacity
              key={op.id}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  playSound("buttonPress");
                }
                setSelectedOperation(op.id);
              }}
              style={[
                styles.operationButton,
                {
                  backgroundColor: selectedOperation === op.id ? colors.primary : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.operationText,
                  {
                    color: selectedOperation === op.id ? "#000000" : colors.foreground,
                  },
                ]}
              >
                {op.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {currentData && currentData.length > 0 ? (
            <View style={styles.leaderboardList}>
              {currentData.map((entry: any, index: number) => (
                <View
                  key={index}
                  style={[styles.leaderboardEntry, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.entryLeft}>
                    <Text style={styles.medalText}>{getMedalEmoji(index + 1)}</Text>
                    <View>
                      <Text style={styles.initialsText}>{entry.initials}</Text>
                      <Text style={styles.dateText}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scoreText}>
                    {isSpeedMode ? `${Math.floor(entry.time / 60)}:${(entry.time % 60).toString().padStart(2, "0")}` : entry.score}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No scores yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to score!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
