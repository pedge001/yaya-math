import { useState } from "react";
import { Text, View, TouchableOpacity, Platform, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { addSubmissionToHistory } from "@/lib/submission-history";
import { retryWithBackoff } from "@/lib/retry-with-backoff";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function EnterInitialsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const correct = parseInt(params.correct as string);
  const total = parseInt(params.total as string);
  const operation = params.operation as "addition" | "subtraction" | "multiplication" | "division";
  const difficulty = params.difficulty as "easy" | "medium" | "hard";

  const [initials, setInitials] = useState(["A", "A", "A"]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const submitScoreMutation = trpc.leaderboard.submitScore.useMutation();

  const handleLetterUp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInitials((prev) => {
      const newInitials = [...prev];
      const currentLetterIndex = ALPHABET.indexOf(newInitials[currentIndex]);
      const nextLetterIndex = (currentLetterIndex + 1) % ALPHABET.length;
      newInitials[currentIndex] = ALPHABET[nextLetterIndex];
      return newInitials;
    });
  };

  const handleLetterDown = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInitials((prev) => {
      const newInitials = [...prev];
      const currentLetterIndex = ALPHABET.indexOf(newInitials[currentIndex]);
      const prevLetterIndex = (currentLetterIndex - 1 + ALPHABET.length) % ALPHABET.length;
      newInitials[currentIndex] = ALPHABET[prevLetterIndex];
      return newInitials;
    });
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (currentIndex < 2) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setRetryMessage(null);

    // Use retry logic with exponential backoff for submission
    const result = await retryWithBackoff(
      () =>
        submitScoreMutation.mutateAsync({
          initials: initials.join(""),
          score: correct,
          totalProblems: total,
          operation: operation,
          difficulty: difficulty,
        }),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        jitterFactor: 0.1,
        onRetry: (attempt, delay, error) => {
          console.log(`Retry attempt ${attempt} after ${delay}ms due to:`, error);
          // Show retry message to user
          const seconds = Math.ceil(delay / 1000);
          setRetryMessage(`Server busy. Retrying in ${seconds}s... (Attempt ${attempt}/3)`);
        },
      }
    );

    if (result.success && result.data) {
      const submissionResult = result.data;

      // Check if submission was successful
      if (submissionResult.success) {
        // Save to local history
        await addSubmissionToHistory({
          initials: initials.join(""),
          score: correct,
          totalProblems: total,
          operation: operation,
          difficulty: difficulty,
          mode: "practice",
        });

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setRetryMessage(null);

        // Show success message
        if (Platform.OS === "web") {
          alert("Congrats! 🎉\nYour score has been submitted!");
        } else {
          Alert.alert(
            "Congrats! 🎉",
            "Your score has been submitted to the leaderboard!",
            [{ text: "OK" }]
          );
        }

        // Auto-navigate to leaderboard after delay
        setTimeout(() => {
          router.push("/(tabs)/leaderboard");
        }, 2000);
      } else {
        // Submission failed
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setRetryMessage(null);

        if (Platform.OS === "web") {
          alert("Failed to submit score. Please try again.");
        } else {
          Alert.alert(
            "Submission Failed",
            submissionResult.error || "Unable to submit score. Please check your connection and try again.",
            [
              { text: "Try Again", style: "default" },
              { text: "Cancel", style: "cancel", onPress: () => router.push("/") }
            ]
          );
        }
      }
    } else {
      // All retries failed
      console.error("Failed to submit score after retries:", result.error);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setRetryMessage(null);

      // Determine error message based on error type
      let errorMessage = "Unable to submit score. Please check your connection and try again.";
      if (result.error instanceof Error) {
        if (result.error.message.includes("429")) {
          errorMessage = "Server is experiencing high traffic. Please wait a moment and try again.";
        } else if (result.error.message.includes("Network")) {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }

      if (Platform.OS === "web") {
        alert(errorMessage);
      } else {
        Alert.alert(
          "Submission Failed",
          errorMessage,
          [
            { text: "Try Again", style: "default" },
            { text: "Cancel", style: "cancel", onPress: () => router.push("/") }
          ]
        );
      }
    }
  };

  return (
    <ScreenContainer className="p-6" style={{ backgroundColor: "#000000" }}>
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="items-center pt-8">
          <View className="absolute left-0 top-0">
            <BackButton />
          </View>
          <Text
            className="text-4xl font-bold mb-4"
            style={{
              color: colors.primary,
              textShadowColor: colors.primary,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            NEW HIGH SCORE!
          </Text>
          <Text
            className="text-2xl font-bold mb-2"
            style={{
              color: "#FFD700",
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            {correct} / {total}
          </Text>
          <Text
            className="text-base mb-8"
            style={{
              color: colors.primary,
              opacity: 0.8,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            ENTER YOUR INITIALS
          </Text>
        </View>

        {/* Initials Display */}
        <View className="flex-1 justify-center items-center">
          <View className="flex-row gap-4 mb-12">
            {initials.map((letter, index) => (
              <View
                key={index}
                className="items-center justify-center"
                style={{
                  width: 80,
                  height: 100,
                  borderWidth: 4,
                  borderColor: index === currentIndex ? colors.primary : "rgba(182, 255, 251, 0.3)",
                  backgroundColor: index === currentIndex ? "rgba(182, 255, 251, 0.1)" : "transparent",
                }}
              >
                <Text
                  className="text-6xl font-bold"
                  style={{
                    color: colors.primary,
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  {letter}
                </Text>
              </View>
            ))}
          </View>

          {/* Letter Controls */}
          <View className="items-center gap-4 mb-8">
            <TouchableOpacity
              onPress={handleLetterUp}
              className="w-20 h-20 items-center justify-center border-2"
              style={{
                borderColor: colors.primary,
                backgroundColor: "rgba(182, 255, 251, 0.1)",
              }}
            >
              <Text
                className="text-4xl font-bold"
                style={{
                  color: colors.primary,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                ▲
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={handlePrev}
                disabled={currentIndex === 0}
                className="w-20 h-20 items-center justify-center border-2"
                style={{
                  borderColor: currentIndex === 0 ? "rgba(182, 255, 251, 0.3)" : colors.primary,
                  backgroundColor: "rgba(182, 255, 251, 0.1)",
                  opacity: currentIndex === 0 ? 0.5 : 1,
                }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{
                    color: colors.primary,
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  ◄
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                disabled={currentIndex === 2}
                className="w-20 h-20 items-center justify-center border-2"
                style={{
                  borderColor: currentIndex === 2 ? "rgba(182, 255, 251, 0.3)" : colors.primary,
                  backgroundColor: "rgba(182, 255, 251, 0.1)",
                  opacity: currentIndex === 2 ? 0.5 : 1,
                }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{
                    color: colors.primary,
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  ►
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLetterDown}
              className="w-20 h-20 items-center justify-center border-2"
              style={{
                borderColor: colors.primary,
                backgroundColor: "rgba(182, 255, 251, 0.1)",
              }}
            >
              <Text
                className="text-4xl font-bold"
                style={{
                  color: colors.primary,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          {/* Retry Message */}
          {retryMessage && (
            <View
              className="mb-6 p-4 rounded-lg"
              style={{
                backgroundColor: "rgba(61, 207, 194, 0.2)",
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text
                className="text-center text-sm"
                style={{
                  color: colors.primary,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                {retryMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View className="pb-4">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitScoreMutation.isPending}
            className="py-4 rounded-lg"
            style={{
              backgroundColor: colors.primary,
              opacity: submitScoreMutation.isPending ? 0.5 : 1,
            }}
          >
            {submitScoreMutation.isPending ? (
              <View className="flex-row items-center justify-center gap-3">
                <ActivityIndicator color="#000000" size="small" />
                <Text
                  className="text-center text-xl font-bold"
                  style={{
                    color: "#000000",
                    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  }}
                >
                  SUBMITTING...
                </Text>
              </View>
            ) : (
              <Text
                className="text-center text-xl font-bold"
                style={{
                  color: "#000000",
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                }}
              >
                SUBMIT SCORE
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
