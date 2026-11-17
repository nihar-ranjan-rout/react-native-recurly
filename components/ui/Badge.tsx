import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { theme } from "@/constants/theme";

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "danger"
  | "neutral"
  | "primary"
  | "accent";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  dot?: boolean;
}

export default function Badge({
  label,
  variant = "neutral",
  style,
  dot = false,
}: BadgeProps) {
  const resolvedVariant = variant === "danger" ? "error" : variant;
  const variantStyles = styles[resolvedVariant] || styles.neutral;

  return (
    <View style={[styles.badge, variantStyles.container, style]}>
      {dot && <View style={[styles.dot, variantStyles.dot]} />}
      <Text style={[styles.text, variantStyles.text]}>{label}</Text>
    </View>
  );
}

const styles = {
  badge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999, // Smooth rounded pill
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11.5,
    fontWeight: "600" as const,
    letterSpacing: 0.1,
  },
  success: StyleSheet.create({
    container: {
      backgroundColor: "#EAF4E7",
      borderWidth: 1,
      borderColor: theme.colors.successBorder, // #B7D9A8
    },
    dot: {
      backgroundColor: "#2E7D32",
    },
    text: {
      color: "#1E5819",
    },
  }),
  warning: StyleSheet.create({
    container: {
      backgroundColor: "#FFF3E8",
      borderWidth: 1,
      borderColor: "#FCD5B5",
    },
    dot: {
      backgroundColor: theme.colors.accent, // #F28C45
    },
    text: {
      color: "#C45E1E",
    },
  }),
  error: StyleSheet.create({
    container: {
      backgroundColor: "#FEF2F2",
      borderWidth: 1,
      borderColor: "#FCA5A5",
    },
    dot: {
      backgroundColor: "#DC2626",
    },
    text: {
      color: "#991B1B",
    },
  }),
  neutral: StyleSheet.create({
    container: {
      backgroundColor: "#F5F1E8",
      borderWidth: 1,
      borderColor: theme.colors.cardBorder, // #E9E6DC
    },
    dot: {
      backgroundColor: "#777777",
    },
    text: {
      color: "#555555",
    },
  }),
  primary: StyleSheet.create({
    container: {
      backgroundColor: theme.colors.primary, // #171717
      borderWidth: 1,
      borderColor: "#2E2E2E",
    },
    dot: {
      backgroundColor: theme.colors.accent,
    },
    text: {
      color: "#FFFFFF",
    },
  }),
  accent: StyleSheet.create({
    container: {
      backgroundColor: theme.colors.accentLight,
      borderWidth: 1,
      borderColor: theme.colors.accentBorder,
    },
    dot: {
      backgroundColor: theme.colors.accent,
    },
    text: {
      color: theme.colors.accentText,
    },
  }),
};
