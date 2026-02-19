import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Theme colors
export const Colors = {
  light: {
    primary: '#3dcfc2',
    background: '#ffffff',
    surface: '#f5f5f5',
    foreground: '#11181C',
    muted: '#687076',
    border: '#E5E7EB',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    tint: '#3dcfc2',
  },
  dark: {
    primary: '#3dcfc2',
    background: '#151718',
    surface: '#1e2022',
    foreground: '#ECEDEE',
    muted: '#9BA1A6',
    border: '#334155',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    tint: '#3dcfc2',
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
  '2xl': 40,
  '3xl': 48,
  xxl: 56,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Common line heights
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

// Shadows (for Android elevation)
export const shadows = {
  sm: {
    elevation: 2,
  },
  md: {
    elevation: 4,
  },
  lg: {
    elevation: 8,
  },
  xl: {
    elevation: 12,
  },
};

// Common text styles
export const createTextStyles = (colors: ThemeColors) => StyleSheet.create({
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
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
