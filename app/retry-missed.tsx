import { useState, useEffect, useRef } from "react";
import { Text, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";

interface IncorrectQuestion {
  num1: number;
  num2: number;
  operation: string;
  correctAnswer: number;
  userAnswer: number;
}

function getOperationSymbol(operation: string): string {
  switch (operation) {
    case "addition":
      return "+";
    case "subtraction":
      return "−";
    case "multiplication":
      return "×";
    case "division":
      return "÷";
    default:
      return "+";
  }
}

export default function RetryMissedScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const operations = (params.operations as string)?.split(",") || [];
  const difficulty = (params.difficulty as string) || "easy";
  const showResults = params.showResults === "true";

  // Parse the retry data
  const incorrectQuestions: IncorrectQuestion[] = (() => {
    try {
      const raw = params.retryData as string;
      if (!raw) return [];
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return [];
    }
  })();

  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [showingCorrectAnswer, setShowingCorrectAnswer] = useState(false);
  const retryIncorrectRef = useRef<IncorrectQuestion[]>([]);

  const backgroundColor = useSharedValue(colors.surface);
  const scale = useSharedValue(1);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      padding: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingBottom: spacing.sm,
    },
    headerText: {
      fontSize: fontSize.xs,
      color: colors.muted,
    },
    problemContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    problemCard: {
      padding: spacing.md,
      borderRadius: borderRadius.xl,
    },
    problemText: {
      fontSize: 28,
      fontWeight: fontWeight.bold,
      color: colors.foreground,
      textAlign: 'center',
    },
    answerInputContainer: {
      height: 40,
      width: 128,
      borderBottomWidth: 4,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    answerText: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: colors.foreground,
    },
    correctAnswerContainer: {
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: `${colors.error}20`,
    },
    correctAnswerText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.bold,
      color: colors.error,
      textAlign: 'center',
    },
    keypadContainer: {
      gap: spacing.sm,
    },
    keypadRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    keypadButton: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keypadButtonText: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.semibold,
      color: colors.foreground,
    },
    backspaceText: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semibold,
      color: colors.foreground,
    },
    submitButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: fontSize.xl,
      color: colors.muted,
    },
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(timer);
  }, [startTime]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
    transform: [{ scale: scale.value }],
  }));

  const handleNumberPress = (num: string) => {
    if (showingCorrectAnswer) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    if (userAnswer.length < 3) {
      setUserAnswer(userAnswer + num);
    }
  };

  const handleBackspace = () => {
    if (showingCorrectAnswer) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    setUserAnswer(userAnswer.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (userAnswer === "" || showingCorrectAnswer) return;

    const answer = parseInt(userAnswer);
    const problem = incorrectQuestions[currentProblemIndex];
    const isCorrect = answer === problem.correctAnswer;

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

    // Track incorrect answers
    if (!isCorrect) {
      retryIncorrectRef.current.push({
        ...problem,
        userAnswer: answer,
      });
    }

    // If showResults is enabled and answer is wrong, show the correct answer
    if (showResults && !isCorrect) {
      setShowingCorrectAnswer(true);
      setTimeout(() => {
        setShowingCorrectAnswer(false);
        advanceToNext(isCorrect);
      }, 1500);
    } else {
      setTimeout(() => {
        advanceToNext(isCorrect);
      }, 600);
    }
  };

  const advanceToNext = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    if (currentProblemIndex < incorrectQuestions.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setUserAnswer("");
      backgroundColor.value = colors.surface;
    } else {
      // Retry session complete
      const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
      const time = Math.floor((Date.now() - startTime) / 1000);
      const total = incorrectQuestions.length;
      const accuracy = Math.round((finalCorrect / total) * 100);

      // Encode retry incorrect questions
      const retryIncorrectData = retryIncorrectRef.current.length > 0
        ? encodeURIComponent(JSON.stringify(retryIncorrectRef.current))
        : "";

      router.push(
        `/results?correct=${finalCorrect}&total=${total}&time=${time}&accuracy=${accuracy}&operations=${operations.join(",")}&speedMode=false&difficulty=${difficulty}&showResults=${showResults}&incorrectQuestions=${retryIncorrectData}`
      );
    }
  };

  if (incorrectQuestions.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No questions to retry</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentProblem = incorrectQuestions[currentProblemIndex];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View>
            <Text style={styles.headerText}>Q{currentProblemIndex + 1}/{incorrectQuestions.length}</Text>
          </View>
          <View>
            <Text style={styles.headerText}>Score: {correctCount}/{currentProblemIndex}</Text>
          </View>
        </View>

        {/* Problem */}
        <View style={styles.problemContainer}>
          <Animated.View style={[animatedStyle, styles.problemCard]}>
            <Text style={styles.problemText}>
              {currentProblem.num1} {getOperationSymbol(currentProblem.operation)} {currentProblem.num2} =
            </Text>
            <View style={styles.answerInputContainer}>
              <Text style={styles.answerText}>{userAnswer || " "}</Text>
            </View>
            {showingCorrectAnswer && (
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerText}>
                  Correct answer: {currentProblem.correctAnswer}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Keypad */}
        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                style={styles.keypadButton}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                style={styles.keypadButton}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num.toString())}
                style={styles.keypadButton}
              >
                <Text style={styles.keypadButtonText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity
              onPress={handleBackspace}
              style={styles.keypadButton}
            >
              <Text style={styles.backspaceText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress("0")}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={userAnswer === "" || showingCorrectAnswer}
              style={[
                styles.submitButton,
                {
                  backgroundColor: (userAnswer !== "" && !showingCorrectAnswer) ? colors.primary : colors.border,
                  opacity: (userAnswer !== "" && !showingCorrectAnswer) ? 1 : 0.5,
                },
              ]}
            >
              <Text style={[styles.submitButtonText, { color: (userAnswer !== "" && !showingCorrectAnswer) ? "#000000" : colors.muted }]}>
                ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
