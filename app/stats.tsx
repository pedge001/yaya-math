import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { useColors } from "@/hooks/use-colors";
import { getUserStats, getOperationStats, type OperationStats } from "@/lib/stats-tracker";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

const OPERATION_SYMBOLS: Record<Operation, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

const OPERATION_LABELS: Record<Operation, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
};

export default function StatsScreen() {
  const colors = useColors();
  const [selectedOp, setSelectedOp] = useState<Operation>("addition");
  const [opStats, setOpStats] = useState<OperationStats | null>(null);
  const [totalStats, setTotalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [selectedOp]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const stats = await getUserStats();
      setTotalStats(stats);
      const opData = await getOperationStats(selectedOp);
      setOpStats(opData);
    } catch (error) {
      console.error("[Stats] Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOperationChange = (op: Operation) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOp(op);
  };

  if (loading || !opStats || !totalStats) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted">Loading stats...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <BackButton />
          <Text className="text-2xl font-bold text-foreground">Your Stats</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Overall Stats Card */}
        <View className="w-full rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-semibold text-foreground mb-4">Overall Performance</Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Total Problems:</Text>
              <Text className="text-base font-bold text-foreground">{totalStats.totalProblems}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Correct:</Text>
              <Text className="text-base font-bold" style={{ color: colors.success }}>
                {totalStats.totalCorrect}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Accuracy:</Text>
              <Text className="text-base font-bold" style={{ color: colors.primary }}>
                {totalStats.overallAccuracy}%
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Sessions:</Text>
              <Text className="text-base font-bold text-foreground">{totalStats.totalSessions}</Text>
            </View>
          </View>
        </View>

        {/* Operation Filter Buttons */}
        <View className="flex-row gap-2 mb-6">
          {(["addition", "subtraction", "multiplication", "division"] as Operation[]).map((op) => (
            <TouchableOpacity
              key={op}
              onPress={() => handleOperationChange(op)}
              className="flex-1 py-3 rounded-lg items-center"
              style={{
                backgroundColor: selectedOp === op ? colors.primary : colors.surface,
                borderWidth: selectedOp === op ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: selectedOp === op ? "#000000" : colors.foreground }}
              >
                {OPERATION_SYMBOLS[op]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Operation Stats Card */}
        <View className="w-full rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-semibold text-foreground mb-4">
            {OPERATION_LABELS[selectedOp]} Stats
          </Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Attempts:</Text>
              <Text className="text-base font-bold text-foreground">{opStats.totalAttempts}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Correct:</Text>
              <Text className="text-base font-bold" style={{ color: colors.success }}>
                {opStats.correctAttempts}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-base text-muted">Accuracy:</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                {opStats.accuracy}%
              </Text>
            </View>
          </View>
        </View>

        {/* Number Range Analysis */}
        {opStats.numberRangeAnalysis.length > 0 && (
          <View className="w-full rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.surface }}>
            <Text className="text-lg font-semibold text-foreground mb-4">Performance by Number Range</Text>
            <View className="gap-3">
              {opStats.numberRangeAnalysis.map((range, idx) => (
                <View key={idx} className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base text-muted">{range.range}</Text>
                    <Text className="text-xs text-muted">{range.attemptCount} attempts</Text>
                  </View>
                  <View
                    className="h-8 rounded-lg items-center justify-center px-3"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      minWidth: 60,
                    }}
                  >
                    <Text className="font-bold" style={{ color: colors.primary }}>
                      {range.accuracy}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Most Missed Problems */}
        {opStats.mostMissedProblems.length > 0 && (
          <View className="w-full rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.surface }}>
            <Text className="text-lg font-semibold text-foreground mb-4">Most Frequently Missed</Text>
            <View className="gap-2">
              {opStats.mostMissedProblems.slice(0, 5).map((problem, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.error}10` }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {problem.num1} {OPERATION_SYMBOLS[selectedOp]} {problem.num2} = {problem.correctAnswer}
                    </Text>
                    <Text className="text-xs text-muted">Missed {problem.missCount} times</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold" style={{ color: colors.error }}>
                      {Math.round((problem.missCount / problem.attemptCount) * 100)}% wrong
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {opStats.totalAttempts === 0 && (
          <View className="w-full rounded-2xl p-6 items-center justify-center" style={{ backgroundColor: colors.surface }}>
            <Text className="text-base text-muted">No data yet for {OPERATION_LABELS[selectedOp]}</Text>
            <Text className="text-sm text-muted mt-2">Complete practice sessions to see stats</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
