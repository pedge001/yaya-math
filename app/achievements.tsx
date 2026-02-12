import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getAchievements, type Achievement } from "@/lib/achievements";
import { playSound } from "@/lib/sound-manager";

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const data = await getAchievements();
    setAchievements(data);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Achievements</Text>
          <Text className="text-lg text-muted">
            {unlockedCount} / {totalCount} Unlocked
          </Text>
        </View>

        {/* Achievements Grid */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="gap-3 pb-4">
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: achievement.unlocked ? colors.surface : colors.border,
                  opacity: achievement.unlocked ? 1 : 0.5,
                }}
              >
                <View className="flex-row items-center gap-4">
                  {/* Badge */}
                  <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: achievement.unlocked ? colors.primary : colors.muted }}>
                    <Text className="text-3xl">{achievement.badge}</Text>
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground mb-1">{achievement.title}</Text>
                    <Text className="text-sm text-muted mb-2">{achievement.description}</Text>

                    {/* Progress Bar */}
                    {!achievement.unlocked && achievement.target && achievement.progress !== undefined && (
                      <View className="mt-2">
                        <View className="h-2 rounded-full" style={{ backgroundColor: colors.border }}>
                          <View
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: colors.primary,
                              width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                            }}
                          />
                        </View>
                        <Text className="text-xs text-muted mt-1">
                          {achievement.progress} / {achievement.target}
                        </Text>
                      </View>
                    )}

                    {/* Unlocked Date */}
                    {achievement.unlocked && achievement.unlockedDate && (
                      <Text className="text-xs text-muted mt-1">
                        Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Checkmark */}
                  {achievement.unlocked && (
                    <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.success }}>
                      <Text className="text-white font-bold">✓</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
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
