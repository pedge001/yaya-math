import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getStreakData, getStreakBadge, getStreakMessage, type StreakData } from "@/lib/streak-tracker";
import { playSound } from "@/lib/sound-manager";
import { getUnlockedCount } from "@/lib/achievements";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

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

export default function OperationSelectionScreen() {
  const [selectedOperations, setSelectedOperations] = useState<Set<Operation>>(new Set());
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastPracticeDate: "", longestStreak: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState(0);
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    loadStreakData();
    loadAchievements();
  }, []);

  const loadStreakData = async () => {
    const data = await getStreakData();
    setStreakData(data);
  };

  const loadAchievements = async () => {
    const count = await getUnlockedCount();
    setUnlockedAchievements(count);
  };

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

  const selectAll = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound("buttonPress");
    }
    if (selectedOperations.size === operations.length) {
      setSelectedOperations(new Set());
    } else {
      setSelectedOperations(new Set(operations.map((op) => op.id)));
    }
  };

  const startPractice = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const operationsParam = Array.from(selectedOperations).join(",");
    router.push(`/practice?operations=${operationsParam}&speedMode=${isSpeedMode}`);
  };

  const toggleSpeedMode = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound("buttonPress");
    }
    setIsSpeedMode(!isSpeedMode);
  };

  const allSelected = selectedOperations.size === operations.length;

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="items-center pt-8">
          <Text className="text-4xl font-bold text-foreground mb-2">Math Practice</Text>
          <Text className="text-base text-muted">Choose operations to practice</Text>
          
          {/* Streak Badge */}
          {streakData.currentStreak > 0 && (
            <View className="mt-4 px-6 py-3 rounded-full border-2" style={{ borderColor: colors.primary, backgroundColor: "rgba(182, 255, 251, 0.1)" }}>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{getStreakBadge(streakData.currentStreak)}</Text>
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  {streakData.currentStreak} Day Streak!
                </Text>
              </View>
              <Text className="text-xs text-center text-muted mt-1">
                {getStreakMessage(streakData.currentStreak)}
              </Text>
            </View>
          )}

          {/* Achievements Button */}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              router.push("/achievements");
            }}
            className="mt-3"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Text className="text-lg">🏅</Text>
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                Achievements ({unlockedAchievements}/12)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Challenge Button */}
        <View className="items-center mt-4">
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                playSound("buttonPress");
              }
              router.push("/daily-challenge");
            }}
            className="py-3 px-6 rounded-full border-2"
            style={{
              borderColor: colors.primary,
              backgroundColor: "rgba(182, 255, 251, 0.1)",
            }}
          >
            <Text className="text-lg font-bold" style={{ color: colors.primary }}>
              🌟 Today's Challenge
            </Text>
          </TouchableOpacity>
        </View>

        {/* Operation Cards Grid */}
        <View className="flex-1 justify-center">
          <View className="gap-4">
            <View className="flex-row gap-4">
              {operations.slice(0, 2).map((op) => {
                const isSelected = selectedOperations.has(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => toggleOperation(op.id)}
                    className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center border-2"
                    style={{
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
                    }}
                  >
                    <Text className="text-6xl mb-2" style={{ color: colors.foreground }}>
                      {op.symbol}
                    </Text>
                    <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row gap-4">
              {operations.slice(2, 4).map((op) => {
                const isSelected = selectedOperations.has(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => toggleOperation(op.id)}
                    className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center border-2"
                    style={{
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
                    }}
                  >
                    <Text className="text-6xl mb-2" style={{ color: colors.foreground }}>
                      {op.symbol}
                    </Text>
                    <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Speed Mode Toggle */}
        <View className="items-center mb-4">
          <TouchableOpacity
            onPress={toggleSpeedMode}
            className="flex-row items-center gap-2 py-3 px-6 rounded-full border-2"
            style={{
              borderColor: isSpeedMode ? colors.primary : "rgba(182, 255, 251, 0.3)",
              backgroundColor: isSpeedMode ? "rgba(182, 255, 251, 0.1)" : "transparent",
            }}
          >
            <Text className="text-2xl">⚡</Text>
            <Text
              className="text-base font-semibold"
              style={{ color: isSpeedMode ? colors.primary : colors.muted }}
            >
              Speed Mode {isSpeedMode ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard Links */}
        <View className="items-center mb-4 gap-2">
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              router.push("/leaderboard");
            }}
          >
            <Text
              className="text-base font-semibold underline"
              style={{ color: colors.primary }}
            >
              🏆 View Leaderboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              router.push("/speed-leaderboard");
            }}
          >
            <Text
              className="text-base font-semibold underline"
              style={{ color: colors.primary }}
            >
              ⚡ Speed Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 pb-4">
          <TouchableOpacity
            onPress={selectAll}
            className="py-4 rounded-full border-2"
            style={{
              borderColor: colors.primary,
              backgroundColor: allSelected ? `${colors.primary}20` : "transparent",
            }}
          >
            <Text className="text-center text-base font-semibold" style={{ color: colors.foreground }}>
              {allSelected ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={startPractice}
            disabled={selectedOperations.size === 0}
            className="py-4 rounded-full"
            style={{
              backgroundColor: selectedOperations.size > 0 ? colors.primary : colors.border,
              opacity: selectedOperations.size > 0 ? 1 : 0.5,
            }}
          >
            <Text
              className="text-center text-base font-bold"
              style={{ color: selectedOperations.size > 0 ? "#000000" : colors.muted }}
            >
              Start Practice
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
