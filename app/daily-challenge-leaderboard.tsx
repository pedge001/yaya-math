import { Text, View, TouchableOpacity, Platform, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function DailyChallengeLeaderboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: leaderboardData, isLoading } = trpc.dailyChallenge.getTodaysLeaderboard.useQuery();

  const today = new Date().toISOString().split("T")[0];

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer className="p-6" style={{ backgroundColor: "#000000" }}>
      <View className="flex-1">
        {/* Retro Header */}
        <View className="items-center pt-4 pb-4">
          <Text
            className="text-5xl font-bold mb-2"
            style={{
              color: colors.primary,
              textShadowColor: colors.primary,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            🌟 TODAY'S CHALLENGE 🌟
          </Text>
          <Text
            className="text-sm text-muted"
            style={{
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            {today}
          </Text>
          <Text
            className="text-sm text-muted"
            style={{
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            ═══════════════════════
          </Text>
        </View>

        {/* Leaderboard Table */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView className="flex-1">
            <View className="gap-2">
              {leaderboardData && leaderboardData.length > 0 ? (
                leaderboardData.map((entry, index) => {
                  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                  return (
                    <View
                      key={entry.id}
                      className="flex-row items-center justify-between p-4 border-2"
                      style={{
                        borderColor: index < 3 ? colors.primary : "rgba(182, 255, 251, 0.3)",
                        backgroundColor: index < 3 ? "rgba(182, 255, 251, 0.05)" : "transparent",
                      }}
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text
                          className="text-xl font-bold"
                          style={{
                            color: colors.primary,
                            fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                            minWidth: 40,
                          }}
                        >
                          {medal} {index + 1}.
                        </Text>
                        <Text
                          className="text-2xl font-bold"
                          style={{
                            color: colors.primary,
                            fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                          }}
                        >
                          {entry.initials}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-2xl font-bold"
                          style={{
                            color: colors.primary,
                            fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                          }}
                        >
                          {entry.score}/{entry.totalProblems}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{
                            color: "rgba(182, 255, 251, 0.6)",
                            fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                          }}
                        >
                          {Math.round((entry.score / entry.totalProblems) * 100)}%
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="items-center justify-center py-12">
                  <Text
                    className="text-lg text-muted"
                    style={{
                      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                    }}
                  >
                    NO SCORES YET TODAY
                  </Text>
                  <Text
                    className="text-sm text-muted mt-2"
                    style={{
                      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                    }}
                  >
                    Be the first to complete the challenge!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Back Button */}
        <View className="pt-6">
          <TouchableOpacity
            onPress={handleBack}
            className="py-4 px-6 rounded-full border-2 items-center"
            style={{
              borderColor: colors.primary,
              backgroundColor: "rgba(182, 255, 251, 0.1)",
            }}
          >
            <Text
              className="text-lg font-bold"
              style={{
                color: colors.primary,
                fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
              }}
            >
              ← BACK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
