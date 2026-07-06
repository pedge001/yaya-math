import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Platform, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";
import { getSubmissionHistory, SubmissionEntry } from "@/lib/submission-history";
import { getStreakData, getStreakBadge, type StreakData } from "@/lib/streak-tracker";
import { useAuth } from "@/hooks/use-auth";
import { startGoogleLogin } from "@/lib/google-auth";

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout, refresh } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastPracticeDate: "", longestStreak: 0 });
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load submission history and refresh auth state when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSubmissions();
      // Refresh auth state in case user just completed Google OAuth
      refresh();
    }, [])
  );

  const loadSubmissions = async () => {
    setLoading(true);
    const history = await getSubmissionHistory();
    setSubmissions(history);
    const streak = await getStreakData();
    setStreakData(streak);
    setLoading(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatOperation = (operation: string) => {
    return operation.charAt(0).toUpperCase() + operation.slice(1);
  };

  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      fontSize: 30,
      fontWeight: fontWeight.bold,
      color: colors.primary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: fontWeight.bold,
      color: '#B6FFFB',
      marginBottom: spacing.md,
    },
    linkButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#B6FFFB',
      backgroundColor: 'rgba(182, 255, 251, 0.1)',
    },
    linkButtonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: '#B6FFFB',
      textAlign: 'center',
    },
    placeholderText: {
      fontSize: fontSize.base,
      color: '#9CA3AF',
      textAlign: 'center',
      marginTop: spacing.md,
    },
    scoreItem: {
      backgroundColor: 'rgba(182, 255, 251, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(182, 255, 251, 0.2)',
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    scoreHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    scoreInitials: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    scoreValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: '#FFD700',
    },
    scoreDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    scoreDetailText: {
      fontSize: fontSize.sm,
      color: '#9CA3AF',
    },
    emptyText: {
      fontSize: fontSize.base,
      color: '#9CA3AF',
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    accountCard: {
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
    },
    accountInfo: {
      gap: 4,
    },
    accountName: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
    accountEmail: {
      fontSize: fontSize.base,
    },
    accountMethod: {
      fontSize: fontSize.sm,
      marginTop: 4,
    },
    logoutButton: {
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    logoutText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    googleIcon: {
      fontSize: 20,
      fontWeight: fontWeight.bold,
      color: '#4285F4',
    },
    googleButtonText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
    },
  });

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Profile</Text>

        {/* Streak Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Streak</Text>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: 'rgba(182, 255, 251, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(182, 255, 251, 0.2)',
            borderRadius: 12,
            padding: spacing.lg,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>
                {(() => {
                  const today = new Date().toISOString().split("T")[0];
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
                  const isActive = streakData.lastPracticeDate === today || streakData.lastPracticeDate === yesterday;
                  const current = isActive ? streakData.currentStreak : 0;
                  return getStreakBadge(current) || "\uD83C\uDF31";
                })()}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.warning, marginTop: 4 }}>
                {(() => {
                  const today = new Date().toISOString().split("T")[0];
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
                  const isActive = streakData.lastPracticeDate === today || streakData.lastPracticeDate === yesterday;
                  return isActive ? streakData.currentStreak : 0;
                })()}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: '#9CA3AF', marginTop: 2 }}>Current</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(182, 255, 251, 0.2)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>
                {getStreakBadge(streakData.longestStreak) || "\uD83C\uDF31"}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary, marginTop: 4 }}>
                {streakData.longestStreak}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: '#9CA3AF', marginTop: 2 }}>Best</Text>
            </View>
          </View>
          {streakData.longestStreak > 0 && (
            <Text style={{ fontSize: fontSize.xs, color: '#9CA3AF', textAlign: 'center', marginTop: spacing.sm }}>
              Practice daily to beat your record!
            </Text>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: 'rgba(182, 255, 251, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(182, 255, 251, 0.2)',
            borderRadius: 12,
            padding: spacing.lg,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>
                {submissions.reduce((sum, s) => sum + s.totalProblems, 0)}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: '#9CA3AF', marginTop: 4 }}>Problems Solved</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(182, 255, 251, 0.2)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.success }}>
                {submissions.reduce((sum, s) => sum + s.score, 0)}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: '#9CA3AF', marginTop: 4 }}>Correct Answers</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(182, 255, 251, 0.2)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.warning }}>
                {submissions.length > 0
                  ? Math.round((submissions.reduce((sum, s) => sum + s.score, 0) / submissions.reduce((sum, s) => sum + s.totalProblems, 0)) * 100)
                  : 0}%
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: '#9CA3AF', marginTop: 4 }}>Accuracy</Text>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.xs, color: '#9CA3AF', textAlign: 'center', marginTop: spacing.sm }}>
            {submissions.length} {submissions.length === 1 ? 'session' : 'sessions'} completed
          </Text>
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                playSound("buttonPress");
              }
              router.push("/privacy-policy");
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* My Scores Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Scores</Text>
          {loading ? (
            <Text style={styles.placeholderText}>Loading...</Text>
          ) : submissions.length === 0 ? (
            <Text style={styles.emptyText}>
              No submissions yet. Complete a practice session to see your scores here!
            </Text>
          ) : (
            <FlatList
              data={submissions}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.scoreItem}>
                  <View style={styles.scoreHeader}>
                    <Text style={styles.scoreInitials}>{item.initials}</Text>
                    <Text style={styles.scoreValue}>
                      {item.score}/{item.totalProblems}
                    </Text>
                  </View>
                  <View style={styles.scoreDetails}>
                    <Text style={styles.scoreDetailText}>
                      {formatOperation(item.operation)}
                    </Text>
                    <Text style={styles.scoreDetailText}>•</Text>
                    <Text style={styles.scoreDetailText}>
                      {formatDifficulty(item.difficulty)}
                    </Text>
                    <Text style={styles.scoreDetailText}>•</Text>
                    <Text style={styles.scoreDetailText}>
                      {formatDate(item.timestamp)}
                    </Text>
                    {item.completionTime && (
                      <>
                        <Text style={styles.scoreDetailText}>•</Text>
                        <Text style={styles.scoreDetailText}>
                          {Math.floor(item.completionTime / 60)}:{(item.completionTime % 60).toString().padStart(2, '0')}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {authLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isAuthenticated && user ? (
            <View style={{ gap: spacing.sm }}>
              <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.foreground }]}>
                    {user.name || "User"}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.muted }]}>
                    {user.email || "No email"}
                  </Text>
                  <Text style={[styles.accountMethod, { color: colors.primary }]}>
                    Signed in with Google
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.logoutButton, { borderColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    "Sign Out",
                    "Are you sure you want to sign out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Sign Out",
                        style: "destructive",
                        onPress: async () => {
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }
                          await logout();
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Text style={[styles.placeholderText, { color: colors.muted }]}>
                Sign in to sync your progress across devices
              </Text>
              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={async () => {
                  try {
                    setGoogleLoading(true);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    await startGoogleLogin();
                  } catch (error: any) {
                    Alert.alert("Login Failed", error.message || "Unable to start Google login");
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <>
                    <Text style={[styles.googleIcon]}>G</Text>
                    <Text style={[styles.googleButtonText, { color: colors.foreground }]}>
                      Sign in with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
