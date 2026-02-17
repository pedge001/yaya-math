import { ScrollView, Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, fontSize, fontWeight } from "@/constants/styles";

export default function ProfileScreen() {
  const colors = useThemeColors();

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
      marginBottom: spacing.xxl,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: fontWeight.bold,
      color: '#B6FFFB',
      marginBottom: spacing.md,
    },
    subsection: {
      marginBottom: spacing.lg,
    },
    subsectionTitle: {
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
      marginTop: spacing.sm,
    },
    bulletTextFirst: {
      fontSize: fontSize.base,
      color: '#D1D5DB',
      lineHeight: 24,
      marginLeft: spacing.md,
    },
    footer: {
      fontSize: fontSize.sm,
      color: '#9CA3AF',
      marginTop: spacing.md,
      textAlign: 'center',
    },
  });

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Profile</Text>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Data Collection</Text>
            <Text style={styles.bodyText}>
              YaYa Math collects minimal data to enable competitive gameplay. When you submit scores to the leaderboard, we collect:
            </Text>
            <Text style={[styles.bulletText, { marginTop: spacing.sm }]}>
              • Your 3-character initials (chosen by you)
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Your score and completion time
            </Text>
            <Text style={styles.bulletTextFirst}>
              • The operation type and difficulty level
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Data Usage</Text>
            <Text style={styles.bodyText}>
              Your data is used exclusively to display global leaderboards and enable users to compete against one another. We do not:
            </Text>
            <Text style={[styles.bulletText, { marginTop: spacing.sm }]}>
              • Sell your data to third parties
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Use your data for advertising
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Share your data with anyone outside of the app
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Track your personal identity or location
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Local Data</Text>
            <Text style={styles.bodyText}>
              The following data is stored locally on your device and never sent to our servers:
            </Text>
            <Text style={[styles.bulletText, { marginTop: spacing.sm }]}>
              • Personal best scores
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Achievement progress
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Practice statistics and history
            </Text>
            <Text style={styles.bulletTextFirst}>
              • Daily challenge streak counter
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Data Security</Text>
            <Text style={styles.bodyText}>
              All data transmitted to our servers is encrypted using industry-standard HTTPS protocols. Leaderboard data is stored securely and is only accessible through the app.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Children's Privacy</Text>
            <Text style={styles.bodyText}>
              YaYa Math is designed for users of all ages. We do not knowingly collect personal information from children. The app only collects anonymous initials and scores for leaderboard purposes.
            </Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Contact</Text>
            <Text style={styles.bodyText}>
              If you have questions about this privacy policy or your data, please contact us through the App Store.
            </Text>
          </View>

          <Text style={styles.footer}>
            Last updated: February 16, 2026
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
