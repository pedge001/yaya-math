import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Theme colors
export const Colors = {
  light: {
    primary: '#0a7ea4',
    background: '#ffffff',
    surface: '#f5f5f5',
    foreground: '#11181C',
    muted: '#687076',
    border: '#E5E7EB',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    tint: '#0a7ea4',
  },
  dark: {
    primary: '#0a7ea4',
    background: '#151718',
    surface: '#1e2022',
    foreground: '#ECEDEE',
    muted: '#9BA1A6',
    border: '#334155',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    tint: '#0a7ea4',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;

// Hook to get current theme colors
export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme() ?? 'light';
  return Colors[colorScheme];
}

// Common style utilities
export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  stylesFn: (colors: ThemeColors) => T
) => {
  return (colors: ThemeColors) => StyleSheet.create(stylesFn(colors));
};

// Common spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Common border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Common font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Common font weights
export const fontWeight: { [key: string]: TextStyle['fontWeight'] } = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Common shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Common button styles
export const createButtonStyles = (colors: ThemeColors) => StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  secondary: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.foreground,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  disabled: {
    opacity: 0.5,
  },
});

// Common text styles
export const createTextStyles = (colors: ThemeColors) => StyleSheet.create({
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  bodyMuted: {
    fontSize: fontSize.base,
    color: colors.muted,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
