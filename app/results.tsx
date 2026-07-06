import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { updateStreak } from "@/lib/streak-tracker";
import { playSound } from "@/lib/sound-manager";
import { checkAndUpdatePersonalBest } from "@/lib/personal-best-tracker";
import { updateAchievementProgress } from "@/lib/achievements";
import { getStreakData } from "@/lib/streak-tracker";
import { saveSession } from "@/lib/statistics-tracker";

interface IncorrectQuestion {
  num1: number;
  num2: number;
  operation: string;
  correctAnswer: number;
  userAnswer: number;
}

function getOperationSymbol(operation: string): string {
  switch (operation) {
    case "addition":
      return "+";
    case "subtraction":
      return "−";
    case "multiplication":
      return "×";
    case "division":
      return "÷";
    default:
      return "+";
  }
}

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const correct = parseInt(params.correct as string);
  const total = parseInt(params.total as string);
  const operations = params.operations as string;
  const isSpeedMode = params.speedMode === "true";
  const showResults = params.showResults === "true";
  const completionTime = params.completionTime
    ? parseInt(params.completionTime as string)
    : params.time
    ? parseInt(params.time as string)
    : 0;
  const difficulty = (params.difficulty as string) || "easy";

  // Parse incorrect questions from URL params
  const incorrectQuestions: IncorrectQuestion[] = (() => {
    try {
      const raw = params.incorrectQuestions as string;
      if (!raw) return [];
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return [];
    }
  })();

  // Parse first operation for leaderboard checking
  const firstOperation = operations.split(",")[0] as "addition" | "subtraction" | "multiplication" | "division";

  const percentage = Math.round((correct / total) * 100);

  const { data: leaderboardData } = trpc.leaderboard.getTop10.useQuery({ operation: firstOperation, difficulty: difficulty as "easy" | "medium" | "hard", totalProblems: total }, { enabled: !isSpeedMode });
  const { data: speedLeaderboardData } = trpc.speedLeaderboard.getTop10.useQuery({ operation: firstOperation, difficulty: difficulty as "easy" | "medium" | "hard", totalProblems: total }, { enabled: isSpeedMode });
  const [isHighScore, setIsHighScore] = useState(false);
  const [isPersonalBest, setIsPersonalBest] = useState(false);

  useEffect(() => {
    // Update streak when results screen loads
    updateStreak();

    // Check for personal best
    checkAndUpdatePersonalBest(firstOperation, correct, isSpeedMode, completionTime).then((isNewBest) => {
      setIsPersonalBest(isNewBest);
    });

    // Save session statistics
    saveSession(firstOperation, total, correct, isSpeedMode ? completionTime : undefined, isSpeedMode);

    // Update achievements
    const isPerfect = correct === total;
    const isSpeedUnder3Min = isSpeedMode && completionTime < 180;
    getStreakData().then((streakData) => {
      updateAchievementProgress(total, isPerfect, isSpeedUnder3Min, streakData.currentStreak);
    });

    if (isSpeedMode && speedLeaderboardData) {
      // Check if this time qualifies for top 10 (lower is better)
      if (speedLeaderboardData.length < 10) {
        setIsHighScore(true);
        if (Platform.OS !== "web") {
          playSound("highScore");
        }
      } else {
        const slowestTime = speedLeaderboardData[speedLeaderboardData.length - 1].completionTime;
        if (completionTime < slowestTime) {
          setIsHighScore(true);
          if (Platform.OS !== "web") {
            playSound("highScore");
          }
        }
      }
    } else if (!isSpeedMode && leaderboardData) {
      // Check if this score qualifies for top 10
      if (leaderboardData.length < 10) {
        setIsHighScore(true);
        if (Platform.OS !== "web") {
          playSound("highScore");
        }
      } else {
        const lowestScore = leaderboardData[leaderboardData.length - 1].score;
        if (correct > lowestScore) {
          setIsHighScore(true);
          if (Platform.OS !== "web") {
            playSound("highScore");
          }
        }
      }
    }
  }, [leaderboardData, speedLeaderboardData, correct, completionTime, isSpeedMode]);

  const handleEnterInitials = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isSpeedMode) {
      router.push({
        pathname: "/enter-initials-speed",
        params: { completionTime, total, operation: firstOperation, difficulty },
      });
    } else {
      router.push({
        pathname: "/enter-initials",
        params: { correct, total, operation: firstOperation, difficulty },
      });
    }
  };

  const handlePracticeAgain = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/practice?operations=${operations}&speedMode=${isSpeedMode}&difficulty=${difficulty}&questionCount=${total}&showResults=${showResults}`);
  };

  const handleRetryMissed = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (incorrectQuestions.length === 0) return;
    const retryData = encodeURIComponent(JSON.stringify(incorrectQuestions));
    router.push({
      pathname: "/retry-missed",
      params: { operations, difficulty, retryData, showResults: showResults.toString() },
    });
  };

  const handleChangeOperations = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/");
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-between">
          {/* Header */}
          <View className="items-center pt-8">
            <View className="absolute left-0 top-0">
              <BackButton />
            </View>
            <Text className="text-3xl font-bold text-foreground mb-2">Practice Complete!</Text>
          </View>

          {/* Results Display */}
          <View className="flex-1 justify-center items-center gap-8 py-6">
            <View className="items-center">
              <Text className="text-7xl font-bold mb-4" style={{ color: colors.primary }}>
                {percentage}%
              </Text>
              <Text className="text-2xl font-semibold text-foreground">
                {correct} / {total} Correct
              </Text>
            </View>

            {isPersonalBest && (
              <View className="w-full max-w-sm rounded-2xl p-4 mb-4" style={{ backgroundColor: "#FFD700" }}>
                <Text className="text-xl font-bold text-center" style={{ color: "#000000" }}>
                  🎉 NEW PERSONAL BEST! 🎉
                </Text>
              </View>
            )}

            <View className="w-full max-w-sm bg-surface rounded-2xl p-6" style={{ backgroundColor: colors.surface }}>
              <View className="flex-row justify-between mb-3">
                <Text className="text-base text-muted">Correct Answers:</Text>
                <Text className="text-base font-semibold" style={{ color: colors.success }}>
                  {correct}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Incorrect Answers:</Text>
                <Text className="text-base font-semibold" style={{ color: colors.error }}>
                  {total - correct}
                </Text>
              </View>
            </View>

            {/* Incorrect Questions Review */}
            {incorrectQuestions.length > 0 && (
              <View className="w-full max-w-sm rounded-2xl p-4" style={{ backgroundColor: colors.surface }}>
                <Text className="text-lg font-bold text-foreground mb-3">
                  Questions to Review ({incorrectQuestions.length})
                </Text>
                {incorrectQuestions.map((q, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between py-2"
                    style={index < incorrectQuestions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                  >
                    <View className="flex-1">
                      <Text className="text-base text-foreground">
                        {q.num1} {getOperationSymbol(q.operation)} {q.num2} = ?
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm" style={{ color: colors.error, textDecorationLine: 'line-through' }}>
                        {q.userAnswer}
                      </Text>
                      <Text className="text-sm font-bold" style={{ color: colors.success }}>
                        {q.correctAnswer}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="gap-3 pb-4">
            {isHighScore && (
              <TouchableOpacity
                onPress={handleEnterInitials}
                className="py-4 rounded-full"
                style={{ backgroundColor: "#FFD700" }}
              >
                <Text className="text-center text-base font-bold" style={{ color: "#000000" }}>
                  🏆 Submit to Leaderboard
                </Text>
              </TouchableOpacity>
            )}

            {incorrectQuestions.length > 0 && (
              <TouchableOpacity
                onPress={handleRetryMissed}
                className="py-4 rounded-full border-2"
                style={{ borderColor: colors.error }}
              >
                <Text className="text-center text-base font-bold" style={{ color: colors.error }}>
                  🔄 Retry Missed ({incorrectQuestions.length})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handlePracticeAgain}
              className="py-4 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-center text-base font-bold" style={{ color: "#000000" }}>
                Practice Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChangeOperations}
              className="py-4 rounded-full border-2"
              style={{ borderColor: colors.primary }}
            >
              <Text className="text-center text-base font-semibold text-foreground">Change Operations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
