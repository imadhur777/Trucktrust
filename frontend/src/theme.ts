// Design tokens for TruckTrust. Light + dark themes.
// Keys match the "color" block of /app/design_guidelines.json.
// Use makeStyles() for StyleSheets and useTheme().colors for color props.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#111827",
  surfaceSecondary: "#F3F4F6",
  onSurfaceSecondary: "#374151",
  surfaceTertiary: "#E5E7EB",
  onSurfaceTertiary: "#4B5563",
  surfaceInverse: "#111827",
  onSurfaceInverse: "#FFFFFF",
  muted: "#6B7280",

  brand: "#B23A22",
  onBrand: "#FFFFFF",
  brandPrimary: "#C0392B",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#E65100",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FDE8E4",
  onBrandTertiary: "#C0392B",

  success: "#059669",
  onSuccess: "#FFFFFF",
  warning: "#D97706",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#475569",
  onInfo: "#FFFFFF",

  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  divider: "#F3F4F6",
};

const dark: typeof light = {
  surface: "#111827",
  onSurface: "#F9FAFB",
  surfaceSecondary: "#1F2937",
  onSurfaceSecondary: "#D1D5DB",
  surfaceTertiary: "#374151",
  onSurfaceTertiary: "#9CA3AF",
  surfaceInverse: "#F9FAFB",
  onSurfaceInverse: "#111827",
  muted: "#9CA3AF",

  brand: "#B23A22",
  onBrand: "#FFFFFF",
  brandPrimary: "#E04A32",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF8C53",
  onBrandSecondary: "#111827",
  brandTertiary: "#3F1A13",
  onBrandTertiary: "#FDE8E4",

  success: "#10B981",
  onSuccess: "#064E3B",
  warning: "#F59E0B",
  onWarning: "#78350F",
  error: "#EF4444",
  onError: "#7F1D1D",
  info: "#94A3B8",
  onInfo: "#0F172A",

  border: "#374151",
  borderStrong: "#4B5563",
  divider: "#1F2937",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Spacing & radius tokens from design_guidelines.json
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;
