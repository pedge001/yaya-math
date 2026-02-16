import { useState } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { playSound } from "@/lib/sound-manager";

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
  const colors = useColors();
  const router = useRouter();

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
    router.push(`/practice?operations=${operationsParam}&speedMode=${isSpeedMode}&difficulty=${difficulty}`);
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

  return (
    <ScreenContainer className="p-4">
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="items-center pt-2 pb-4">
          <Text className="text-3xl font-bold text-foreground">Math Practice</Text>
          <Text className="text-sm text-muted mt-1">Choose operations to practice</Text>
        </View>

        {/* Operation Cards Grid - Smaller */}
        <View className="flex-1 justify-center">
          <View className="gap-3">
            <View className="flex-row gap-3">
              {operations.slice(0, 2).map((op) => {
                const isSelected = selectedOperations.has(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => toggleOperation(op.id)}
                    className="flex-1 aspect-square bg-surface rounded-xl items-center justify-center border-2"
                    style={{
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
                    }}
                  >
                    <Text className="text-5xl mb-1" style={{ color: colors.primary }}>
                      {op.symbol}
                    </Text>
                    <Text className="text-xs font-medium text-foreground">{op.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row gap-3">
              {operations.slice(2, 4).map((op) => {
                const isSelected = selectedOperations.has(op.id);
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => toggleOperation(op.id)}
                    className="flex-1 aspect-square bg-surface rounded-xl items-center justify-center border-2"
                    style={{
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? `${colors.primary}20` : colors.surface,
                    }}
                  >
                    <Text className="text-5xl mb-1" style={{ color: colors.primary }}>
                      {op.symbol}
                    </Text>
                    <Text className="text-xs font-medium text-foreground">{op.label}</Text>
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
            className="flex-row items-center gap-2 py-2 px-4 rounded-full border-2"
            style={{
              borderColor: isSpeedMode ? colors.primary : "rgba(182, 255, 251, 0.3)",
              backgroundColor: isSpeedMode ? "rgba(182, 255, 251, 0.1)" : "transparent",
            }}
          >
            <Text className="text-xl">⚡</Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: isSpeedMode ? colors.primary : colors.muted }}
            >
              Speed Mode {isSpeedMode ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Difficulty Level Selection */}
        <View className="mb-4">
          <Text className="text-xs text-muted text-center mb-2">Difficulty</Text>
          <View className="flex-row gap-2 justify-center">
            {difficultyLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => toggleDifficulty(level.id)}
                className="px-4 py-2 rounded-lg border-2"
                style={{
                  borderColor: difficulty === level.id ? colors.primary : colors.border,
                  backgroundColor: difficulty === level.id ? `${colors.primary}20` : colors.surface,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: difficulty === level.id ? colors.primary : colors.muted }}
                >
                  {level.label}
                </Text>
                <Text className="text-xs text-muted text-center">{level.range}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Button */}
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
    </ScreenContainer>
  );
}
