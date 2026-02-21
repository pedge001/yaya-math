import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeColors, fontSize } from "@/constants/styles";

interface BackButtonProps {
  onPress?: () => void;
}

/**
 * Back button component with "<" symbol in brand color.
 * Positioned in top-left corner of screens.
 * Uses router.back() by default or custom onPress handler.
 */
export function BackButton({ onPress }: BackButtonProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={[styles.arrow, { color: colors.primary }]}>{"<"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: fontSize["2xl"],
    fontWeight: "600",
  },
});
