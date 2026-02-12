import { useState } from "react";
import { Text, View, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function EnterInitialsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const correct = parseInt(params.correct as string);
  const total = parseInt(params.total as string);
  const operation = params.operation as "addition" | "subtraction" | "multiplication" | "division";

  const [initials, setInitials] = useState(["A", "A", "A"]);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await submitScoreMutation.mutateAsync({
        initials: initials.join(""),
        score: correct,
        totalProblems: total,
        operation: operation,
      });

      router.push("/leaderboard");
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  };

  return (
    <ScreenContainer className="p-6" style={{ backgroundColor: "#000000" }}>
      <View className="flex-1 justify-between">
        {/* Header */}
        <View className="items-center pt-8">
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
              <ActivityIndicator color="#000000" />
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
