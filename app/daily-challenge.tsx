import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Operation = "addition" | "subtraction" | "multiplication" | "division";

interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

const TOTAL_PROBLEMS = 20; // Daily challenge is 20 problems

function generateDailyProblems(seed: string): Problem[] {
  // Use date as seed for consistent daily problems
  const seedNum = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = (index: number) => {
    const x = Math.sin(seedNum + index) * 10000;
    return x - Math.floor(x);
  };

  const problems: Problem[] = [];
  const operations: Operation[] = ["addition", "subtraction", "multiplication", "division"];

  for (let i = 0; i < TOTAL_PROBLEMS; i++) {
    const operation = operations[Math.floor(rng(i * 4) * operations.length)];
    let num1: number, num2: number, answer: number;

    switch (operation) {
      case "addition":
        num1 = Math.floor(rng(i * 4 + 1) * 50) + 1;
        num2 = Math.floor(rng(i * 4 + 2) * 50) + 1;
        answer = num1 + num2;
        break;
      case "subtraction":
        num1 = Math.floor(rng(i * 4 + 1) * 50) + 1;
        num2 = Math.floor(rng(i * 4 + 2) * num1) + 1;
        answer = num1 - num2;
        break;
      case "multiplication":
        num1 = Math.floor(rng(i * 4 + 1) * 10) + 1;
        num2 = Math.floor(rng(i * 4 + 2) * 10) + 1;
        answer = num1 * num2;
        break;
      case "division":
        num2 = Math.floor(rng(i * 4 + 1) * 10) + 1;
        answer = Math.floor(rng(i * 4 + 2) * 10) + 1;
        num1 = num2 * answer;
        break;
    }

    problems.push({ num1, num2, operation, answer });
  }

  return problems;
}

function getOperationSymbol(operation: Operation): string {
  switch (operation) {
    case "addition":
      return "+";
    case "subtraction":
      return "−";
    case "multiplication":
      return "×";
    case "division":
      return "÷";
  }
}

export default function DailyChallengeScreen() {
  const router = useRouter();
  const colors = useColors();

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const [problems] = useState<Problem[]>(generateDailyProblems(today));
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);

  const backgroundColor = useSharedValue(colors.surface);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    transform: [{ scale: scale.value }],
  }));

  const handleNumberPress = (num: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setUserAnswer((prev) => prev + num);
  };

  const handleBackspace = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setUserAnswer((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (userAnswer === "" || problems.length === 0) return;

    const currentProblem = problems[currentProblemIndex];
    const isCorrect = parseInt(userAnswer) === currentProblem.answer;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      );
    }

    // Animate feedback
    backgroundColor.value = withSequence(
      withTiming(isCorrect ? "#22C55E" : "#EF4444", { duration: 200 }),
      withTiming(colors.surface, { duration: 300 })
    );

    scale.value = withSequence(withTiming(1.05, { duration: 100 }), withTiming(1, { duration: 100 }));

    setTimeout(() => {
      if (currentProblemIndex + 1 >= TOTAL_PROBLEMS) {
        router.push({
          pathname: "/daily-challenge-results",
          params: {
            correct: correctCount + (isCorrect ? 1 : 0),
            total: TOTAL_PROBLEMS,
            challengeDate: today,
          },
        });
      } else {
        setCurrentProblemIndex((prev) => prev + 1);
        setUserAnswer("");
      }

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
    }, 500);
  };

  if (problems.length === 0) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-xl text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
            🌟 DAILY CHALLENGE 🌟
          </Text>
          <Text className="text-sm text-muted">{today}</Text>
        </View>

        {/* Progress and Score */}
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-base font-medium text-muted">
            Question {currentProblemIndex + 1} of {TOTAL_PROBLEMS}
          </Text>
          <Text className="text-base font-medium text-muted">
            Score: {correctCount}/{currentProblemIndex}
          </Text>
        </View>

        {/* Problem Display */}
        <View className="flex-1 justify-center items-center">
          <Animated.View
            className="w-full p-8 rounded-3xl items-center justify-center"
            style={animatedStyle}
          >
            <Text className="text-6xl font-bold text-foreground mb-4">
              {currentProblem.num1} {getOperationSymbol(currentProblem.operation)} {currentProblem.num2} =
            </Text>
            <View className="h-16 w-48 border-b-4 items-center justify-center" style={{ borderColor: colors.primary }}>
              <Text className="text-4xl font-bold text-foreground">{userAnswer || " "}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Keypad */}
        <View className="gap-3 pb-4">
          <View className="flex-row gap-3">
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 py-6 rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-3xl font-bold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 py-6 rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-3xl font-bold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 py-6 rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-3xl font-bold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleBackspace}
              className="flex-1 py-6 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-2xl font-bold text-foreground">⌫</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress("0")}
              className="flex-1 py-6 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-3xl font-bold text-foreground">0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="flex-1 py-6 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              disabled={userAnswer === ""}
            >
              <Text className="text-2xl font-bold" style={{ color: "#000000" }}>
                ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
