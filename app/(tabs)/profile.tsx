import { ScrollView, Text, View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useThemeColors, spacing, fontSize, fontWeight } from "@/constants/styles";
import { playSound } from "@/lib/sound-manager";

export default function ProfileScreen() {
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
