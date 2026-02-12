import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getOverallStats,
  getOperationStats,
  getImprovementTrends,
  type OperationStats,
  type ImprovementTrend,
} from "@/lib/statistics-tracker";
import { playSound } from "@/lib/sound-manager";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

const operations: { id: Operation; label: string; symbol: string }[] = [
  { id: "addition", label: "Addition", symbol: "+" },
  { id: "subtraction", label: "Subtraction", symbol: "−" },
  { id: "multiplication", label: "Multiplication", symbol: "×" },
  { id: "division", label: "Division", symbol: "÷" },
];

export default function StatisticsScreen() {
  const [selectedOperation, setSelectedOperation] = useState<Operation>("addition");
  const [operationStats, setOperationStats] = useState<OperationStats | null>(null);
  const [trends, setTrends] = useState<ImprovementTrend[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, [selectedOperation]);

  const loadStats = async () => {
    const overall = await getOverallStats();
    setOverallStats(overall);

    const opStats = await getOperationStats(selectedOperation);
    setOperationStats(opStats);

    const trendData = await getImprovementTrends(selectedOperation, 7);
    setTrends(trendData);
  };

  const renderBarChart = (data: { label: string; value: number; color: string }[]) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const chartWidth = Dimensions.get("window").width - 80;

    return (
      <View className="gap-3">
        {data.map((item, index) => (
          <View key={index} className="gap-1">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-foreground w-24">{item.label}</Text>
              <Text className="text-sm font-bold" style={{ color: item.color }}>
                {item.value}%
              </Text>
            </View>
            <View className="h-6 rounded-full" style={{ backgroundColor: colors.border, width: chartWidth }}>
              <View
                className="h-6 rounded-full"
                style={{
                  backgroundColor: item.color,
                  width: `${(item.value / maxValue) * 100}%`,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLineChart = (trends: ImprovementTrend[]) => {
    if (trends.length === 0) {
      return (
        <View className="items-center py-8">
          <Text className="text-muted">No data available yet</Text>
        </View>
      );
    }

    const chartWidth = Dimensions.get("window").width - 80;
    const chartHeight = 150;
    const maxAccuracy = Math.max(...trends.map((t) => t.accuracy), 100);
    const minAccuracy = Math.min(...trends.map((t) => t.accuracy), 0);
    const range = maxAccuracy - minAccuracy || 1;

    return (
      <View>
        <View className="h-40 relative" style={{ width: chartWidth }}>
          {/* Y-axis labels */}
          <View className="absolute left-0 top-0 bottom-0 justify-between">
            <Text className="text-xs text-muted">{maxAccuracy}%</Text>
            <Text className="text-xs text-muted">{Math.round((maxAccuracy + minAccuracy) / 2)}%</Text>
            <Text className="text-xs text-muted">{minAccuracy}%</Text>
          </View>

          {/* Chart area */}
          <View className="absolute left-10 right-0 top-0 bottom-0">
            <View className="flex-row items-end justify-between h-full">
              {trends.map((trend, index) => {
                const height = ((trend.accuracy - minAccuracy) / range) * chartHeight;
                return (
                  <View key={index} className="items-center gap-2" style={{ flex: 1 }}>
                    <View
                      className="rounded-t-lg"
                      style={{
                        backgroundColor: colors.primary,
                        height: Math.max(height, 4),
                        width: Math.min(30, chartWidth / trends.length - 10),
                      }}
                    />
                    <Text className="text-xs text-muted" numberOfLines={1}>
                      {new Date(trend.date).getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Statistics</Text>
          <Text className="text-base text-muted">Track your progress</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Overall Stats */}
          {overallStats && (
            <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surface }}>
              <Text className="text-lg font-bold text-foreground mb-4">Overall Performance</Text>
              <View className="flex-row flex-wrap gap-4">
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {overallStats.totalSessions}
                  </Text>
                  <Text className="text-sm text-muted">Total Sessions</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {overallStats.overallAccuracy}%
                  </Text>
                  <Text className="text-sm text-muted">Accuracy</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {overallStats.totalProblems}
                  </Text>
                  <Text className="text-sm text-muted">Problems Solved</Text>
                </View>
                {overallStats.averageTime > 0 && (
                  <View className="flex-1 min-w-[45%]">
                    <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {Math.floor(overallStats.averageTime / 60)}:{(overallStats.averageTime % 60).toString().padStart(2, "0")}
                    </Text>
                    <Text className="text-sm text-muted">Avg Time</Text>
                  </View>
                )}
              </View>
            </View>
          )}

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
                className="flex-1 py-3 rounded-xl"
                style={{
                  backgroundColor: selectedOperation === op.id ? colors.primary : colors.surface,
                }}
              >
                <Text
                  className="text-center font-bold"
                  style={{
                    color: selectedOperation === op.id ? "#000000" : colors.foreground,
                  }}
                >
                  {op.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Operation Stats */}
          {operationStats && (
            <>
              <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surface }}>
                <Text className="text-lg font-bold text-foreground mb-4">
                  {operations.find((o) => o.id === selectedOperation)?.label} Stats
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-1 min-w-[45%]">
                    <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                      {operationStats.averageAccuracy}%
                    </Text>
                    <Text className="text-sm text-muted">Accuracy</Text>
                  </View>
                  <View className="flex-1 min-w-[45%]">
                    <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {operationStats.totalSessions}
                    </Text>
                    <Text className="text-sm text-muted">Sessions</Text>
                  </View>
                  {operationStats.averageTime > 0 && (
                    <View className="flex-1 min-w-[45%]">
                      <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                        {Math.floor(operationStats.averageTime / 60)}:{(operationStats.averageTime % 60).toString().padStart(2, "0")}
                      </Text>
                      <Text className="text-sm text-muted">Avg Time</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Accuracy by Operation Chart */}
              <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surface }}>
                <Text className="text-lg font-bold text-foreground mb-4">Accuracy by Operation</Text>
                {renderBarChart(
                  operations.map((op) => ({
                    label: op.label,
                    value: op.id === selectedOperation ? operationStats.averageAccuracy : 0,
                    color: colors.primary,
                  }))
                )}
              </View>

              {/* 7-Day Trend */}
              <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surface }}>
                <Text className="text-lg font-bold text-foreground mb-4">7-Day Accuracy Trend</Text>
                {renderLineChart(trends)}
              </View>
            </>
          )}
        </ScrollView>

        {/* Back Button */}
        <View className="pt-4">
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              router.back();
            }}
            className="py-4 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-center text-lg font-bold" style={{ color: "#000000" }}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
