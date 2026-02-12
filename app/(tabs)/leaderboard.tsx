import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { playSound } from "@/lib/sound-manager";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

const operations: { id: Operation; label: string; symbol: string }[] = [
  { id: "addition", label: "Addition", symbol: "+" },
  { id: "subtraction", label: "Subtraction", symbol: "−" },
  { id: "multiplication", label: "Multiplication", symbol: "×" },
  { id: "division", label: "Division", symbol: "÷" },
];

export default function LeaderboardScreen() {
  const [selectedOperation, setSelectedOperation] = useState<Operation>("addition");
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const colors = useColors();

  const { data: leaderboardData } = trpc.leaderboard.getTop10.useQuery(
    { operation: selectedOperation },
    { enabled: !isSpeedMode }
  );
  const { data: speedLeaderboardData } = trpc.speedLeaderboard.getTop10.useQuery(
    { operation: selectedOperation },
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
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">🏆 Leaderboard</Text>
          <Text className="text-base text-muted">Top Scores</Text>
        </View>

        {/* Mode Toggle */}
        <View className="flex-row gap-2 mb-6">
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              setIsSpeedMode(false);
            }}
            className="flex-1 py-3 rounded-lg"
            style={{
              backgroundColor: !isSpeedMode ? colors.primary : colors.surface,
            }}
          >
            <Text
              className="text-center font-bold"
              style={{
                color: !isSpeedMode ? "#000000" : colors.foreground,
              }}
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
            className="flex-1 py-3 rounded-lg"
            style={{
              backgroundColor: isSpeedMode ? colors.primary : colors.surface,
            }}
          >
            <Text
              className="text-center font-bold"
              style={{
                color: isSpeedMode ? "#000000" : colors.foreground,
              }}
            >
              Speed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Operation Tabs */}
        <View className="flex-row gap-2 mb-6">
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
              className="flex-1 py-3 rounded-lg"
              style={{
                backgroundColor: selectedOperation === op.id ? colors.primary : colors.surface,
              }}
            >
              <Text
                className="text-center font-bold text-lg"
                style={{
                  color: selectedOperation === op.id ? "#000000" : colors.foreground,
                }}
              >
                {op.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {currentData && currentData.length > 0 ? (
            <View className="gap-3">
              {currentData.map((entry: any, index: number) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <Text className="text-2xl w-8 text-center">{getMedalEmoji(index + 1)}</Text>
                    <View>
                      <Text className="text-lg font-bold text-foreground">{entry.initials}</Text>
                      <Text className="text-xs text-muted">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {isSpeedMode ? `${Math.floor(entry.time / 60)}:${(entry.time % 60).toString().padStart(2, "0")}` : entry.score}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-lg text-muted">No scores yet</Text>
              <Text className="text-sm text-muted mt-2">Be the first to score!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
