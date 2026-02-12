import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { updateStreak } from "@/lib/streak-tracker";

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const correct = parseInt(params.correct as string);
  const total = parseInt(params.total as string);
  const operations = params.operations as string;
  const isSpeedMode = params.speedMode === "true";
  const completionTime = params.completionTime ? parseInt(params.completionTime as string) : 0;
  
  // Parse first operation for leaderboard checking
  const firstOperation = operations.split(",")[0] as "addition" | "subtraction" | "multiplication" | "division";

  const percentage = Math.round((correct / total) * 100);

  const { data: leaderboardData } = trpc.leaderboard.getTop10.useQuery({ operation: firstOperation }, { enabled: !isSpeedMode });
  const { data: speedLeaderboardData } = trpc.speedLeaderboard.getTop10.useQuery({ operation: firstOperation }, { enabled: isSpeedMode });
  const [isHighScore, setIsHighScore] = useState(false);

  useEffect(() => {
    // Update streak when results screen loads
    updateStreak();

    if (isSpeedMode && speedLeaderboardData) {
      // Check if this time qualifies for top 10 (lower is better)
      if (speedLeaderboardData.length < 10) {
        setIsHighScore(true);
      } else {
        const slowestTime = speedLeaderboardData[speedLeaderboardData.length - 1].completionTime;
        if (completionTime < slowestTime) {
          setIsHighScore(true);
        }
      }
    } else if (!isSpeedMode && leaderboardData) {
      // Check if this score qualifies for top 10
      if (leaderboardData.length < 10) {
        setIsHighScore(true);
      } else {
        const lowestScore = leaderboardData[leaderboardData.length - 1].score;
        if (correct > lowestScore) {
          setIsHighScore(true);
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
        params: { completionTime, total, operation: firstOperation },
      });
    } else {
      router.push({
        pathname: "/enter-initials",
        params: { correct, total, operation: firstOperation },
      });
    }
  };

  const handlePracticeAgain = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/practice?operations=${operations}`);
  };

  const handleChangeOperations = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/");
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="items-center pt-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Practice Complete!</Text>
        </View>

        {/* Results Display */}
        <View className="flex-1 justify-center items-center gap-8">
          <View className="items-center">
            <Text className="text-7xl font-bold mb-4" style={{ color: colors.primary }}>
              {percentage}%
            </Text>
            <Text className="text-2xl font-semibold text-foreground">
              {correct} / {total} Correct
            </Text>
          </View>

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
    </ScreenContainer>
  );
}
