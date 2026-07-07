import { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { Confetti } from "@/components/confetti";
import { useColors } from "@/hooks/use-colors";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import {
  getDailyChallengeState,
  completeDailyChallenge,
  getStreakState,
  BADGE_INFO,
  type DailyProblem,
  type DailyChallengeState,
  type DailyStreakState,
} from "@/lib/daily-challenge";

const OPERATION_SYMBOLS: Record<string, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

type Phase = "loading" | "already_done" | "playing" | "complete";

export default function DailyChallengeScreen() {
  const colors = useColors();
  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<DailyChallengeState | null>(null);
  const [streak, setStreak] = useState<DailyStreakState | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<boolean[]>([]);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [ch, st] = await Promise.all([getDailyChallengeState(), getStreakState()]);
    setChallenge(ch);
    setStreak(st);
    setPhase(ch.completed ? "already_done" : "playing");
  };

  const currentProblem: DailyProblem | null =
    challenge && currentIdx < challenge.problems.length
      ? challenge.problems[currentIdx]
      : null;

  const handleSubmit = () => {
    if (!currentProblem || !answer.trim()) return;
    const userAnswer = parseInt(answer.trim(), 10);
    const correct = userAnswer === currentProblem.answer;

    if (Platform.OS !== "web") {
      if (correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    const newResults = [...results, correct];
    setResults(newResults);

    if (!correct) {
      setCorrectAnswer(currentProblem.answer);
      setShowCorrect(true);
      setTimeout(() => advance(newResults), 1500);
    } else {
      advance(newResults);
    }
  };

  const advance = (currentResults: boolean[]) => {
    setShowCorrect(false);
    setCorrectAnswer(null);
    setAnswer("");

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const nextIdx = currentIdx + 1;
    if (challenge && nextIdx >= challenge.problems.length) {
      const score = currentResults.filter(Boolean).length;
      finishChallenge(score, currentResults);
    } else {
      setCurrentIdx(nextIdx);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const handleShare = async (score: number, currentStreak: number) => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const emoji = score === 10 ? "🏆" : score >= 7 ? "🌟" : "✅";
      const streakLine = currentStreak > 1 ? `🔥 ${currentStreak} day streak!\n` : "";
      const scoreBar = Array.from({ length: 10 }, (_, i) => i < score ? "🟩" : "🟥").join("");
      const message = `${emoji} YaYa Math Daily Challenge — ${today}\n\nScore: ${score}/10\n${scoreBar}\n${streakLine}\nCan you beat me? 📱`;

      if (Platform.OS === "web") {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          // Web Share API — write to a temp file and share
          const fileUri = (FileSystem.cacheDirectory ?? "") + "daily-result.txt";
          await FileSystem.writeAsStringAsync(fileUri, message);
          await Sharing.shareAsync(fileUri, { dialogTitle: "Share your Daily Challenge result" });
        } else {
          // Fallback: copy to clipboard via web API
          await (navigator as any).clipboard?.writeText(message);
          alert("Result copied to clipboard!");
        }
      } else {
        // Native: write text to a temp file and share
        const fileUri = (FileSystem.cacheDirectory ?? "") + "daily-result.txt";
        await FileSystem.writeAsStringAsync(fileUri, message);
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Share your Daily Challenge result",
          UTI: "public.plain-text",
        });
      }
    } catch (e) {
      // Sharing cancelled or failed — silently ignore
    } finally {
      setIsSharing(false);
    }
  };

  const finishChallenge = async (score: number, finalResults: boolean[]) => {
    const updatedStreak = await completeDailyChallenge(score);
    const prevBadges = streak?.badges ?? [];
    const earned = updatedStreak.badges.filter((b) => !prevBadges.includes(b));
    setStreak(updatedStreak);
    setNewBadges(earned);
    setResults(finalResults);
    setPhase("complete");
    // Trigger confetti on completion or new badge
    setShowConfetti(true);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted">Loading today's challenge...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Already done today ───────────────────────────────────────────────────
  if (phase === "already_done" && challenge) {
    const score = challenge.score ?? 0;
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
              <Text className="text-base" style={{ color: colors.primary }}>← Back</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center justify-center gap-6">
            <Text className="text-5xl">✅</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              Already completed today!
            </Text>
            <Text className="text-base text-muted text-center">
              You scored {score}/10 on today's challenge.
            </Text>
            {streak && (
              <View
                className="w-full rounded-2xl p-5 items-center gap-2"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-4xl">🔥</Text>
                <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {streak.currentStreak} day streak
                </Text>
                <Text className="text-sm text-muted">
                  Longest: {streak.longestStreak} days · Total: {streak.totalChallengesCompleted} challenges
                </Text>
              </View>
            )}
            <Text className="text-sm text-muted text-center">
              Come back tomorrow for a new challenge!
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="px-8 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-bold" style={{ color: "#000" }}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Complete ─────────────────────────────────────────────────────────────
  if (phase === "complete" && challenge) {
    const score = results.filter(Boolean).length;
    const isPerfect = score === 10;
    return (
      <ScreenContainer className="p-6">
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 items-center gap-6 pt-8">
            <Text className="text-6xl">{isPerfect ? "🏆" : score >= 7 ? "🌟" : "✅"}</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              {isPerfect ? "Perfect Score!" : score >= 7 ? "Great Job!" : "Challenge Complete!"}
            </Text>
            <Text className="text-4xl font-bold" style={{ color: colors.primary }}>
              {score} / 10
            </Text>

            {streak && (
              <View
                className="w-full rounded-2xl p-5 items-center gap-2"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-4xl">🔥</Text>
                <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {streak.currentStreak} day streak
                </Text>
                <Text className="text-sm text-muted">
                  Longest: {streak.longestStreak} days · Total: {streak.totalChallengesCompleted} challenges
                </Text>
              </View>
            )}

            {newBadges.length > 0 && (
              <View className="w-full gap-3">
                <Text className="text-base font-semibold text-foreground text-center">
                  🎉 New Badge{newBadges.length > 1 ? "s" : ""} Earned!
                </Text>
                {newBadges.map((badge) => {
                  const info = BADGE_INFO[badge];
                  if (!info) return null;
                  return (
                    <View
                      key={badge}
                      className="flex-row items-center gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <Text className="text-3xl">{info.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-foreground">{info.label}</Text>
                        <Text className="text-sm text-muted">{info.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View className="w-full gap-2">
              <Text className="text-base font-semibold text-foreground mb-1">Your Answers</Text>
              {challenge.problems.map((p, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: results[idx] ? `${colors.success}15` : `${colors.error}15`,
                  }}
                >
                  <Text className="text-base text-foreground">
                    {p.num1} {OPERATION_SYMBOLS[p.operation]} {p.num2}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-foreground">= {p.answer}</Text>
                    <Text className="text-base">{results[idx] ? "✅" : "❌"}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Share button */}
            <TouchableOpacity
              onPress={() => handleShare(score, streak?.currentStreak ?? 0)}
              disabled={isSharing}
              className="w-full py-4 rounded-2xl items-center"
              style={{
                backgroundColor: "transparent",
                borderWidth: 2,
                borderColor: colors.primary,
                opacity: isSharing ? 0.6 : 1,
              }}
            >
              <Text className="text-base font-bold" style={{ color: colors.primary }}>
                {isSharing ? "Sharing..." : "📤 Share Result"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="w-full py-4 rounded-2xl items-center mb-8"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-bold" style={{ color: "#000" }}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────
  if (!currentProblem || !challenge) return null;

  const progress = currentIdx / challenge.problems.length;

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text className="text-base" style={{ color: colors.primary }}>← Back</Text>
          </TouchableOpacity>
          <Text className="text-base font-semibold text-muted">
            {currentIdx + 1} / {challenge.problems.length}
          </Text>
          {streak && streak.currentStreak > 0 && (
            <Text className="text-base font-semibold" style={{ color: colors.warning }}>
              🔥 {streak.currentStreak}
            </Text>
          )}
        </View>

        {/* Progress bar */}
        <View className="w-full h-2 rounded-full mb-8" style={{ backgroundColor: colors.border }}>
          <View
            className="h-2 rounded-full"
            style={{ width: `${progress * 100}%`, backgroundColor: colors.primary }}
          />
        </View>

        {/* Daily badge label */}
        <View className="items-center mb-2">
          <View
            className="px-4 py-1 rounded-full"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              ⚡ Daily Challenge
            </Text>
          </View>
        </View>

        {/* Problem */}
        <Animated.View style={{ opacity: fadeAnim }} className="flex-1 items-center justify-center gap-8">
          <Text className="text-6xl font-bold text-foreground">
            {currentProblem.num1} {OPERATION_SYMBOLS[currentProblem.operation]} {currentProblem.num2}
          </Text>

          {showCorrect ? (
            <View className="items-center gap-2">
              <Text className="text-xl font-semibold" style={{ color: colors.error }}>Incorrect</Text>
              <Text className="text-3xl font-bold" style={{ color: colors.success }}>
                Answer: {correctAnswer}
              </Text>
            </View>
          ) : (
            <View className="w-full items-center gap-4">
              <TextInput
                ref={inputRef}
                value={answer}
                onChangeText={setAnswer}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                autoFocus
                className="text-center text-4xl font-bold w-40 pb-2"
                style={{
                  borderBottomWidth: 2,
                  borderColor: colors.primary,
                  color: colors.foreground,
                }}
                placeholder="?"
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                className="px-10 py-4 rounded-2xl"
                style={{
                  backgroundColor: answer.trim() ? colors.primary : colors.border,
                  opacity: answer.trim() ? 1 : 0.5,
                }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: answer.trim() ? "#000" : colors.muted }}
                >
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Dot progress indicators */}
        <View className="flex-row justify-center gap-2 pb-4">
          {challenge.problems.map((_, idx) => (
            <View
              key={idx}
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  idx < results.length
                    ? results[idx]
                      ? colors.success
                      : colors.error
                    : idx === currentIdx
                    ? `${colors.primary}40`
                    : colors.border,
              }}
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
