import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function EnterInitialsSpeedScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colors = useColors();

  const completionTime = parseInt(params.completionTime as string);
  const total = parseInt(params.total as string);
  const operation = params.operation as "addition" | "subtraction" | "multiplication" | "division";
  const difficulty = params.difficulty as "easy" | "medium" | "hard";

  const [initials, setInitials] = useState(["A", "A", "A"]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const submitTimeMutation = trpc.speedLeaderboard.submitTime.useMutation();

  const handleUp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInitials((prev) => {
      const newInitials = [...prev];
      const currentLetter = newInitials[currentIndex];
      const currentLetterIndex = ALPHABET.indexOf(currentLetter);
      const nextLetterIndex = (currentLetterIndex + 1) % ALPHABET.length;
      newInitials[currentIndex] = ALPHABET[nextLetterIndex];
      return newInitials;
    });
  };

  const handleDown = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInitials((prev) => {
      const newInitials = [...prev];
      const currentLetter = newInitials[currentIndex];
      const currentLetterIndex = ALPHABET.indexOf(currentLetter);
      const nextLetterIndex = (currentLetterIndex - 1 + ALPHABET.length) % ALPHABET.length;
      newInitials[currentIndex] = ALPHABET[nextLetterIndex];
      return newInitials;
    });
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (currentIndex < 2) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await submitTimeMutation.mutateAsync({
        initials: initials.join(""),
        completionTime: completionTime,
        totalProblems: total,
        operation: operation,
        difficulty: difficulty,
      });

      router.push("/speed-leaderboard");
    } catch (error) {
      console.error("Failed to submit time:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <ScreenContainer className="p-6" style={{ backgroundColor: "#000000" }}>
      <View className="flex-1 justify-center items-center">
        {/* Header */}
        <View className="items-center mb-8">
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
            ⚡ NEW RECORD! ⚡
          </Text>
          <Text
            className="text-2xl font-bold mb-2"
            style={{
              color: colors.primary,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            TIME: {formatTime(completionTime)}
          </Text>
          <Text
            className="text-base text-muted"
            style={{
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            Enter your initials
          </Text>
        </View>

        {/* Initials Display */}
        <View className="flex-row gap-4 mb-8">
          {initials.map((letter, index) => (
            <View
              key={index}
              className="w-20 h-24 border-4 items-center justify-center"
              style={{
                borderColor: index === currentIndex ? colors.primary : "rgba(182, 255, 251, 0.3)",
                backgroundColor: index === currentIndex ? "rgba(182, 255, 251, 0.1)" : "transparent",
              }}
            >
              <Text
                className="text-5xl font-bold"
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

        {/* Arrow Controls */}
        <View className="items-center gap-4 mb-8">
          <TouchableOpacity
            onPress={handleUp}
            className="w-16 h-16 items-center justify-center border-2"
            style={{ borderColor: colors.primary }}
          >
            <Text className="text-3xl" style={{ color: colors.primary }}>
              ▲
            </Text>
          </TouchableOpacity>
          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={handleBack}
              className="w-16 h-16 items-center justify-center border-2"
              style={{ borderColor: colors.primary }}
              disabled={currentIndex === 0}
            >
              <Text className="text-3xl" style={{ color: currentIndex === 0 ? colors.muted : colors.primary }}>
                ◀
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              className="w-16 h-16 items-center justify-center border-2"
              style={{ borderColor: colors.primary }}
              disabled={currentIndex === 2}
            >
              <Text className="text-3xl" style={{ color: currentIndex === 2 ? colors.muted : colors.primary }}>
                ▶
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleDown}
            className="w-16 h-16 items-center justify-center border-2"
            style={{ borderColor: colors.primary }}
          >
            <Text className="text-3xl" style={{ color: colors.primary }}>
              ▼
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="py-4 px-8 rounded-full border-2"
          style={{
            borderColor: colors.primary,
            backgroundColor: "rgba(182, 255, 251, 0.2)",
          }}
          disabled={submitTimeMutation.isPending}
        >
          <Text
            className="text-xl font-bold"
            style={{
              color: colors.primary,
              fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
            }}
          >
            {submitTimeMutation.isPending ? "SUBMITTING..." : "SUBMIT"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
