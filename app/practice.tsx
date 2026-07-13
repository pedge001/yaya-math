import { useState, useEffect, useRef } from "react";
import { Text, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
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
import { BackButton } from "@/components/back-button";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";
import { recordSession, type ProblemStat } from "@/lib/stats-tracker";

type Operation = "addition" | "subtraction" | "multiplication" | "division";
type Difficulty = "easy" | "medium" | "hard";

interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

interface IncorrectQuestion {
  num1: number;
  num2: number;
  operation: Operation;
  correctAnswer: number;
  userAnswer: number;
}

// Default to 50 if not provided (for backward compatibility)
const DEFAULT_TOTAL_PROBLEMS = 50;

function getDifficultyRange(difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return 12;
    case "medium":
      return 20;
    case "hard":
      return 30;
  }
}

function generateProblem(operations: Operation[], difficulty: Difficulty): Problem {
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const maxNum = getDifficultyRange(difficulty);
  let num1: number, num2: number, answer: number;

  switch (operation) {
    case "addition":
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = num1 + num2;
      break;
    case "subtraction":
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case "multiplication":
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = num1 * num2;
      break;
    case "division":
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = Math.floor(Math.random() * maxNum) + 1;
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
  const colors = useThemeColors();

  const operations = (params.operations as string)?.split(",") as Operation[];
  const isSpeedMode = params.speedMode === "true";
  const showResults = params.showResults === "true";
  const difficulty = (params.difficulty as Difficulty) || "easy";
  const questionCount = parseInt(params.questionCount as string) || DEFAULT_TOTAL_PROBLEMS;

  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [showingCorrectAnswer, setShowingCorrectAnswer] = useState(false);
  const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState<number | null>(null);
  const incorrectQuestionsRef = useRef<IncorrectQuestion[]>([]);

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
    timerContainer: {
      alignItems: 'center',
    },
    timerLabel: {
      fontSize: fontSize.xs,
      color: colors.muted,
    },
    timerText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.primary,
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

  useEffect(() => {
    const generatedProblems: Problem[] = [];
    for (let i = 0; i < questionCount; i++) {
      generatedProblems.push(generateProblem(operations, difficulty));
    }
    setProblems(generatedProblems);
  }, [difficulty, questionCount]);

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
    if (showingCorrectAnswer) return; // Block input while showing correct answer
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    if (userAnswer.length < 3) {
      setUserAnswer(userAnswer + num);
    }
  };

  const handleBackspace = () => {
    if (showingCorrectAnswer) return; // Block input while showing correct answer
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playSound("buttonPress");
    }
    setUserAnswer(userAnswer.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (userAnswer === "" || showingCorrectAnswer) return;

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

    // Track incorrect answers
    if (!isCorrect) {
      const problem = problems[currentProblemIndex];
      incorrectQuestionsRef.current.push({
        num1: problem.num1,
        num2: problem.num2,
        operation: problem.operation,
        correctAnswer: problem.answer,
        userAnswer: answer,
      });
    }

    // If showResults is enabled and answer is wrong, show the correct answer
    if (showResults && !isCorrect) {
      setCurrentCorrectAnswer(problems[currentProblemIndex].answer);
      setShowingCorrectAnswer(true);
      
      // Show correct answer for 1.5 seconds, then advance
      setTimeout(() => {
        setShowingCorrectAnswer(false);
        setCurrentCorrectAnswer(null);
        advanceToNext(isCorrect);
      }, 2500);
    } else {
      // Normal flow: advance after 600ms
      setTimeout(() => {
        advanceToNext(isCorrect);
      }, 600);
    }
  };

  const advanceToNext = async (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    if (currentProblemIndex < questionCount - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setUserAnswer("");
      backgroundColor.value = colors.surface;
    } else {
      const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
      const time = Math.floor((Date.now() - startTime) / 1000);
      const accuracy = Math.round((finalCorrect / questionCount) * 100);

      const sessionProblems: ProblemStat[] = problems.map((problem) => ({
        operation: problem.operation,
        num1: problem.num1,
        num2: problem.num2,
        correctAnswer: problem.answer,
        userAnswer: problem.answer,
        isCorrect: true,
        timestamp: Date.now(),
      }));

      incorrectQuestionsRef.current.forEach((incorrect) => {
        const problemIdx = problems.findIndex(
          (p) => p.num1 === incorrect.num1 && p.num2 === incorrect.num2 && p.operation === incorrect.operation
        );
        if (problemIdx >= 0) {
          sessionProblems[problemIdx].userAnswer = incorrect.userAnswer;
          sessionProblems[problemIdx].isCorrect = false;
        }
      });

      await recordSession(sessionProblems);

      const incorrectData = incorrectQuestionsRef.current.length > 0
        ? encodeURIComponent(JSON.stringify(incorrectQuestionsRef.current))
        : "";

      router.push(
        `/results?correct=${finalCorrect}&total=${questionCount}&time=${time}&accuracy=${accuracy}&operations=${params.operations}&speedMode=${isSpeedMode}&difficulty=${difficulty}&showResults=${showResults}&incorrectQuestions=${incorrectData}`
      );
    }
  };
  if (problems.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View>
            <Text style={styles.headerText}>Q{currentProblemIndex + 1}/{questionCount}</Text>
          </View>
          {isSpeedMode && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>TIME</Text>
              <Text style={styles.timerText}>
                {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
              </Text>
            </View>
          )}
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
            {/* Show correct answer when wrong and showResults is enabled */}
            {showingCorrectAnswer && currentCorrectAnswer !== null && (
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerText}>
                  Correct answer: {currentCorrectAnswer}
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
