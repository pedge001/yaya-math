import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform, ScrollView } from "react-native";
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
import { playSound } from "@/lib/sound-manager";

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
  const isSpeedMode = params.speedMode === "true";

  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  const backgroundColor = useSharedValue(colors.surface);
  const scale = useSharedValue(1);

  useEffect(() => {
    const generatedProblems: Problem[] = [];
    for (let i = 0; i < TOTAL_PROBLEMS; i++) {
      generatedProblems.push(generateProblem(operations));
    }
    setProblems(generatedProblems);
  }, []);

  // Timer for speed mode
  useEffect(() => {
    if (!isSpeedMode) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(timer);
  }, [isSpeedMode, startTime]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    transform: [{ scale: scale.value }],
  }));

  const handleNumberPress = (num: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    if (userAnswer.length < 3) {
      setUserAnswer(userAnswer + num);
    }
  };

  const handleBackspace = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    setUserAnswer(userAnswer.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (userAnswer === "") return;

    const answer = parseInt(userAnswer);
    const isCorrect = answer === problems[currentProblemIndex].answer;

    if (Platform.OS !== "web") {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSound("correct");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playSound("incorrect");
      }
    }

    // Animate background
    backgroundColor.value = withTiming(isCorrect ? "#22C55E" : "#EF4444", { duration: 300 });
    scale.value = withSequence(withTiming(1.1, { duration: 200 }), withTiming(1, { duration: 200 }));

    setTimeout(() => {
      if (isCorrect) {
        setCorrectCount(correctCount + 1);
      }

      if (currentProblemIndex < TOTAL_PROBLEMS - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setUserAnswer("");
        backgroundColor.value = colors.surface;
      } else {
        // Session complete
        const time = Math.floor((Date.now() - startTime) / 1000);
        const accuracy = Math.round((correctCount / TOTAL_PROBLEMS) * 100);
        router.push(
          `/results?correct=${correctCount}&total=${TOTAL_PROBLEMS}&time=${time}&accuracy=${accuracy}&operations=${params.operations}&speedMode=${isSpeedMode}`
        );
      }
    }, 600);
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
    <ScreenContainer className="p-2">
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="gap-1 pb-2">
          {isSpeedMode && (
            <View className="items-center">
              <Text className="text-xs text-muted">TIME</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Q{currentProblemIndex + 1}/{TOTAL_PROBLEMS}</Text>
            <Text className="text-xs text-muted">Score: {correctCount}/{currentProblemIndex}</Text>
          </View>
        </View>

        {/* Problem */}
        <View className="items-center justify-center py-3">
          <Animated.View style={animatedStyle} className="p-3 rounded-xl">
            <Text className="text-3xl font-bold text-foreground text-center">
              {currentProblem.num1} {getOperationSymbol(currentProblem.operation)} {currentProblem.num2} =
            </Text>
            <View className="h-10 w-32 border-b-4 items-center justify-center mt-2" style={{ borderColor: colors.primary }}>
              <Text className="text-2xl font-bold text-foreground">{userAnswer || " "}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Keypad */}
        <View className="gap-2">
          <View className="flex-row gap-2">
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 aspect-square bg-surface rounded-lg items-center justify-center"
              >
                <Text className="text-2xl font-semibold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-2">
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 aspect-square bg-surface rounded-lg items-center justify-center"
              >
                <Text className="text-2xl font-semibold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-2">
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                className="flex-1 aspect-square bg-surface rounded-lg items-center justify-center"
              >
                <Text className="text-2xl font-semibold text-foreground">{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleBackspace}
              className="flex-1 aspect-square bg-surface rounded-lg items-center justify-center"
            >
              <Text className="text-xl font-semibold text-foreground">←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress("0")}
              className="flex-1 aspect-square bg-surface rounded-lg items-center justify-center"
            >
              <Text className="text-2xl font-semibold text-foreground">0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={userAnswer === ""}
              className="flex-1 aspect-square rounded-lg items-center justify-center"
              style={{
                backgroundColor: userAnswer !== "" ? colors.primary : colors.border,
                opacity: userAnswer !== "" ? 1 : 0.5,
              }}
            >
              <Text className="text-lg font-bold" style={{ color: userAnswer !== "" ? "#000000" : colors.muted }}>
                ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
