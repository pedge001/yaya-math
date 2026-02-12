import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { updateStreak } from "@/lib/streak-tracker";
import { playSound } from "@/lib/sound-manager";

export default function DailyChallengeResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const correct = parseInt(params.correct as string);
  const total = parseInt(params.total as string);
  const challengeDate = params.challengeDate as string;

  const percentage = Math.round((correct / total) * 100);

  const { data: leaderboardData } = trpc.dailyChallenge.getTodaysLeaderboard.useQuery();
  const [isHighScore, setIsHighScore] = useState(false);

  useEffect(() => {
    // Update streak when daily challenge results screen loads
    updateStreak();

    if (leaderboardData) {
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
  }, [leaderboardData, correct]);

  const handleEnterInitials = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: "/enter-initials-daily",
      params: { correct, total, challengeDate },
    });
  };

  const handleViewLeaderboard = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/daily-challenge-leaderboard");
  };

  const handleHome = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/");
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-center items-center">
        {/* Results Header */}
        <View className="items-center mb-8">
          <Text className="text-5xl mb-4">
            {percentage >= 90 ? "🌟" : percentage >= 70 ? "⭐" : percentage >= 50 ? "👍" : "💪"}
          </Text>
          <Text className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>
            Challenge Complete!
          </Text>
          <Text className="text-6xl font-bold mb-2" style={{ color: colors.primary }}>
            {correct}/{total}
          </Text>
          <Text className="text-2xl text-muted">{percentage}% Correct</Text>
        </View>

        {/* High Score Indicator */}
        {isHighScore && (
          <View className="mb-6 p-4 rounded-2xl border-2" style={{ borderColor: colors.primary }}>
            <Text className="text-xl font-bold text-center" style={{ color: colors.primary }}>
              🏆 NEW HIGH SCORE! 🏆
            </Text>
            <Text className="text-sm text-muted text-center mt-1">
              You made it to today's leaderboard!
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="w-full gap-3">
          {isHighScore && (
            <TouchableOpacity
              onPress={handleEnterInitials}
              className="py-4 rounded-full items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-lg font-bold" style={{ color: "#000000" }}>
                Enter Initials
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleViewLeaderboard}
            className="py-4 rounded-full border-2 items-center"
            style={{ borderColor: colors.primary }}
          >
            <Text className="text-lg font-bold" style={{ color: colors.primary }}>
              View Today's Leaderboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleHome}
            className="py-4 rounded-full border-2 items-center"
            style={{ borderColor: colors.muted }}
          >
            <Text className="text-lg font-bold text-muted">
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
