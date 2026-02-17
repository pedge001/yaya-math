import { ScrollView, Text, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, borderRadius, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";

export default function PrivacyPolicyScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: {
      fontSize: 30,
      fontWeight: fontWeight.bold,
      color: '#B6FFFB',
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: '#FFFFFF',
      marginBottom: spacing.sm,
    },
    bodyText: {
      fontSize: fontSize.base,
      color: '#D1D5DB',
      lineHeight: 24,
    },
    bulletText: {
      fontSize: fontSize.base,
      color: '#D1D5DB',
      lineHeight: 24,
      marginLeft: spacing.md,
    },
    footer: {
      fontSize: fontSize.sm,
      color: '#9CA3AF',
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    backButtonContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    backButton: {
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: '#B6FFFB',
    },
    backButtonText: {
      textAlign: 'center',
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: '#000000',
    },
  });

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Privacy Policy</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          <Text style={styles.bodyText}>
            YaYa Math collects minimal data to enable competitive gameplay. When you submit scores to the leaderboard, we collect:
          </Text>
          <Text style={[styles.bulletText, { marginTop: spacing.sm }]}>
            • Your 3-character initials (chosen by you)
          </Text>
          <Text style={styles.bulletText}>
            • Your score and completion time
          </Text>
          <Text style={styles.bulletText}>
            • The operation type and difficulty level
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Usage</Text>
          <Text style={styles.bodyText}>
            Your data is used exclusively to display global leaderboards and enable users to compete against one another. We do not:
          </Text>
          <Text style={[styles.bulletText, { marginTop: spacing.sm }]}>
            • Sell your data to third parties
          </Text>
          <Text style={styles.bulletText}>
            • Use your data for advertising
          </Text>
          <Text style={styles.bulletText}>
            • Share your data with anyone outside of the app
          </Text>
          <Text style={styles.bulletText}>
            • Track your personal identity or location
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Data</Text>
          <Text style={styles.bodyText}>
            The following data is stored locally on your device and never sent to our servers:
          </Text>
          <Text style={[styles.bulletText, { marginTop: spacing.sm }]}>
            • Personal best scores
          </Text>
          <Text style={styles.bulletText}>
            • Achievement progress
          </Text>
          <Text style={styles.bulletText}>
            • Practice statistics and history
          </Text>
          <Text style={styles.bulletText}>
            • Daily challenge streak counter
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.bodyText}>
            All data transmitted to our servers is encrypted using industry-standard HTTPS protocols. Leaderboard data is stored securely and is only accessible through the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.bodyText}>
            YaYa Math is designed for users of all ages. We do not knowingly collect personal information from children. The app only collects anonymous initials and scores for leaderboard purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.bodyText}>
            If you have questions about this privacy policy or your data, please contact us through the App Store.
          </Text>
        </View>

        <Text style={styles.footer}>
          Last updated: February 16, 2026
        </Text>
      </ScrollView>

      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              playSound("buttonPress");
            }
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
