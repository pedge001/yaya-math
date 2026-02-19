import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { getAchievements, type Achievement } from "@/lib/achievements";
import { playSound } from "@/lib/sound-manager";

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const colors = useThemeColors();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 30,
      fontWeight: fontWeight.bold,
      color: colors.primary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: fontSize.lg,
      color: colors.muted,
    },
    scrollView: {
      flex: 1,
    },
    achievementsList: {
      gap: spacing.md,
      paddingBottom: spacing.md,
    },
    achievementCard: {
      borderRadius: 16,
      padding: spacing.md,
    },
    achievementContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    badgeContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 30,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    achievementDescription: {
      fontSize: fontSize.sm,
      color: colors.muted,
      marginBottom: spacing.sm,
    },
    progressContainer: {
      marginTop: spacing.sm,
    },
    progressBarBackground: {
      height: 8,
      borderRadius: borderRadius.full,
    },
    progressBarFill: {
      height: 8,
      borderRadius: borderRadius.full,
    },
    progressText: {
      fontSize: fontSize.xs,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    unlockedText: {
      fontSize: fontSize.xs,
      color: colors.muted,
      marginTop: spacing.xs,
    },
    checkmarkContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkText: {
      color: '#FFFFFF',
      fontWeight: fontWeight.bold,
    },
    backButtonContainer: {
      paddingTop: spacing.md,
    },
    backButton: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
    },
    backButtonText: {
      textAlign: 'center',
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
  });

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
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>
            {unlockedCount} / {totalCount} Unlocked
          </Text>
        </View>

        {/* Achievements Grid */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  {
                    backgroundColor: achievement.unlocked ? colors.surface : colors.border,
                    opacity: achievement.unlocked ? 1 : 0.5,
                  },
                ]}
              >
                <View style={styles.achievementContent}>
                  {/* Badge */}
                  <View style={[styles.badgeContainer, { backgroundColor: achievement.unlocked ? colors.primary : colors.muted }]}>
                    <Text style={styles.badgeText}>{achievement.badge}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>

                    {/* Progress Bar */}
                    {!achievement.unlocked && achievement.target && achievement.progress !== undefined && (
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                backgroundColor: colors.primary,
                                width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {achievement.progress} / {achievement.target}
                        </Text>
                      </View>
                    )}

                    {/* Unlocked Date */}
                    {achievement.unlocked && achievement.unlockedDate && (
                      <Text style={styles.unlockedText}>
                        Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Checkmark */}
                  {achievement.unlocked && (
                    <View style={[styles.checkmarkContainer, { backgroundColor: colors.success }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              router.back();
            }}
            style={[styles.backButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.backButtonText, { color: "#000000" }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
