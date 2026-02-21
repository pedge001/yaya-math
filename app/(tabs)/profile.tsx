import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Platform, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";
import { getSubmissionHistory, SubmissionEntry } from "@/lib/submission-history";

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load submission history when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSubmissions();
    }, [])
  );

  const loadSubmissions = async () => {
    setLoading(true);
    const history = await getSubmissionHistory();
    setSubmissions(history);
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
  });

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Profile</Text>

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

        {/* Account Section (placeholder for future) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.placeholderText}>
            Name and email settings coming soon
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
