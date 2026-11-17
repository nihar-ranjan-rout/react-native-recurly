import React from "react";
import { Platform, StyleSheet, View, ViewProps } from "react-native";
import { theme } from "@/constants/theme";

interface CardProps extends ViewProps {
  children?: React.ReactNode;
  variant?: "default" | "muted" | "dark" | "outline" | "accent";
}

export default function Card({
  children,
  style,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  default: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    ...theme.shadows.subtle,
  },
  muted: {
    backgroundColor: "#F7F4EB",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  dark: {
    backgroundColor: theme.colors.darkNavy, // #171717
    borderWidth: 1,
    borderColor: "#2E2E2E",
    ...theme.shadows.card,
  },
  accent: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
    ...theme.shadows.card,
  },
});
