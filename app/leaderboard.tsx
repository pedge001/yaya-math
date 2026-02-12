import { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

export default function LeaderboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedOperation, setSelectedOperation] = useState<Operation>("multiplication");
  const { data: leaderboardData, isLoading } = trpc.leaderboard.getTop10.useQuery({ operation: selectedOperation });

  const operations: { key: Operation; label: string; symbol: string }[] = [
    { key: "addition", label: "Add", symbol: "+" },
    { key: "subtraction", label: "Sub", symbol: "−" },
    { key: "multiplication", label: "Mult", symbol: "×" },
    { key: "division", label: "Div", symbol: "÷" },
  ];

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
            HIGH SCORES
          </Text>
          <Text
            className="text-sm"
            style={{
              color: colors.primary,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            ═══════════════════════
          </Text>
        </View>

        {/* Operation Tabs */}
        <View className="flex-row justify-around mb-6 px-2">
          {operations.map((op) => (
            <TouchableOpacity
              key={op.key}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedOperation(op.key);
              }}
              className="items-center justify-center py-2 px-3 border-2"
              style={{
                borderColor: selectedOperation === op.key ? colors.primary : "rgba(182, 255, 251, 0.3)",
                backgroundColor: selectedOperation === op.key ? "rgba(182, 255, 251, 0.1)" : "transparent",
                minWidth: 70,
              }}
            >
              <Text
                className="text-2xl font-bold mb-1"
                style={{
                  color: selectedOperation === op.key ? colors.primary : "rgba(182, 255, 251, 0.5)",
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                {op.symbol}
              </Text>
              <Text
                className="text-xs font-bold"
                style={{
                  color: selectedOperation === op.key ? colors.primary : "rgba(182, 255, 251, 0.5)",
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                {op.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard Table */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View className="flex-1">
            {/* Table Header */}
            <View className="flex-row mb-4 px-4">
              <Text
                className="text-base font-bold"
                style={{
                  color: colors.primary,
                  width: 50,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                RANK
              </Text>
              <Text
                className="text-base font-bold flex-1"
                style={{
                  color: colors.primary,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                NAME
              </Text>
              <Text
                className="text-base font-bold"
                style={{
                  color: colors.primary,
                  width: 80,
                  textAlign: "right",
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                SCORE
              </Text>
            </View>

            {/* Leaderboard Entries */}
            {leaderboardData && leaderboardData.length > 0 ? (
              leaderboardData.map((entry, index) => {
                const rank = index + 1;
                const rankColor = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : colors.primary;
                
                return (
                  <View
                    key={entry.id}
                    className="flex-row items-center px-4 py-3 mb-2"
                    style={{
                      backgroundColor: index % 2 === 0 ? "rgba(182, 255, 251, 0.05)" : "transparent",
                      borderLeftWidth: 4,
                      borderLeftColor: rankColor,
                    }}
                  >
                    <Text
                      className="text-2xl font-bold"
                      style={{
                        color: rankColor,
                        width: 50,
                        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                      }}
                    >
                      {rank}.
                    </Text>
                    <Text
                      className="text-2xl font-bold flex-1"
                      style={{
                        color: colors.primary,
                        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                      }}
                    >
                      {entry.initials}
                    </Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{
                        color: colors.primary,
                        width: 80,
                        textAlign: "right",
                        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                      }}
                    >
                      {entry.score}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text
                  className="text-xl"
                  style={{
                    color: colors.primary,
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  NO SCORES YET
                </Text>
                <Text
                  className="text-sm mt-2"
                  style={{
                    color: colors.primary,
                    opacity: 0.7,
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  BE THE FIRST!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Back Button */}
        <View className="pb-4 pt-8">
          <TouchableOpacity
            onPress={handleBack}
            className="py-4 rounded-lg border-2"
            style={{
              borderColor: colors.primary,
              backgroundColor: "rgba(182, 255, 251, 0.1)",
            }}
          >
            <Text
              className="text-center text-base font-bold"
              style={{
                color: colors.primary,
                fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
              }}
            >
              ← BACK TO MENU
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
