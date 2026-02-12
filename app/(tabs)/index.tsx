import { useState } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

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
  const colors = useColors();
  const router = useRouter();

  const toggleOperation = (operation: Operation) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    }
    if (selectedOperations.size === operations.length) {
      setSelectedOperations(new Set());
    } else {
      setSelectedOperations(new Set(operations.map((op) => op.id)));
    }
  };

  const startPractice = () => {
    if (selectedOperations.size === 0) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const operationsParam = Array.from(selectedOperations).join(",");
    router.push(`/practice?operations=${operationsParam}`);
  };

  const allSelected = selectedOperations.size === operations.length;

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="items-center pt-8">
          <Text className="text-4xl font-bold text-foreground mb-2">Math Practice</Text>
          <Text className="text-base text-muted">Choose operations to practice</Text>
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
