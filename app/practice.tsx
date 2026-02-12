import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
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

const TOTAL_PROBLEMS = 50;

function generateProblem(operations: Operation[]): Problem {
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let num1: number, num2: number, answer: number;

  switch (operation) {
    case "addition":
      num1 = Math.floor(Math.random() * 99) + 1;
      num2 = Math.floor(Math.random() * 99) + 1;
      answer = num1 + num2;
      break;
    case "subtraction":
      num1 = Math.floor(Math.random() * 99) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case "multiplication":
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      break;
    case "division":
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * answer;
      break;
  }

  return { num1, num2, operation, answer };
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

export default function PracticeScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const operations = (params.operations as string)?.split(",") as Operation[];

  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);

  const backgroundColor = useSharedValue(colors.surface);
  const scale = useSharedValue(1);

  useEffect(() => {
    const generatedProblems: Problem[] = [];
    for (let i = 0; i < TOTAL_PROBLEMS; i++) {
      generatedProblems.push(generateProblem(operations));
    }
    setProblems(generatedProblems);
  }, []);

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

    if (isCorrect) {
      backgroundColor.value = withSequence(
        withTiming(colors.success, { duration: 200 }),
        withTiming(colors.surface, { duration: 300 })
      );
      scale.value = withSequence(withSpring(1.05), withSpring(1));
      setCorrectCount((prev) => prev + 1);
    } else {
      backgroundColor.value = withSequence(
        withTiming(colors.error, { duration: 200 }),
        withTiming(colors.surface, { duration: 300 })
      );
      scale.value = withSequence(
        withTiming(0.98, { duration: 50 }),
        withTiming(1.02, { duration: 50 }),
        withTiming(0.98, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
    }

    setTimeout(() => {
      if (currentProblemIndex + 1 >= TOTAL_PROBLEMS) {
        router.push({
          pathname: "/results",
          params: {
            correct: correctCount + (isCorrect ? 1 : 0),
            total: TOTAL_PROBLEMS,
            operations: operations.join(","),
          },
        });
      } else {
        setCurrentProblemIndex((prev) => prev + 1);
        setUserAnswer("");
      }
    }, 500);
  };

  if (problems.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-xl text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
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
                className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-3xl font-semibold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-3xl font-semibold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-3xl font-semibold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleBackspace}
              className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-2xl font-semibold text-foreground">←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress("0")}
              className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-3xl font-semibold text-foreground">0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={userAnswer === ""}
              className="flex-1 aspect-square rounded-2xl items-center justify-center"
              style={{
                backgroundColor: userAnswer !== "" ? colors.primary : colors.border,
                opacity: userAnswer !== "" ? 1 : 0.5,
              }}
            >
              <Text className="text-xl font-bold" style={{ color: userAnswer !== "" ? "#000000" : colors.muted }}>
                ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
