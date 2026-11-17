import React from "react";
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "@/constants/theme";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "neutral" | "accent";
  variant?: "default" | "dark" | "accent";
  style?: ViewStyle;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  iconName,
  iconColor = theme.colors.accent,
  iconBg = "rgba(242, 140, 69, 0.12)",
  badgeText,
  variant = "default",
  style,
}: SummaryCardProps) {
  const isDark = variant === "dark";
  const isAccent = variant === "accent";

  return (
    <View
      style={[
        styles.card,
        isDark && styles.cardDark,
        isAccent && styles.cardAccent,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
        {iconName && (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : iconBg },
            ]}
          >
            <Ionicons
              name={iconName}
              size={18}
              color={isDark ? "#FFFFFF" : iconColor}
            />
          </View>
        )}
      </View>

      <Text style={[styles.value, isDark && styles.valueDark]}>{value}</Text>

      <View style={styles.bottomRow}>
        {subtitle && (
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            {subtitle}
          </Text>
        )}
        {badgeText && (
          <View style={[styles.badge, isDark && styles.badgeDark]}>
            <Text style={[styles.badgeText, isDark && styles.badgeTextDark]}>
              {badgeText}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    ...theme.shadows.subtle,
  },
  cardDark: {
    backgroundColor: theme.colors.darkNavy, // #171717
    borderColor: "#2E2E2E",
  },
  cardAccent: {
    backgroundColor: "#FFFDF5",
    borderColor: theme.colors.accentBorder,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  titleDark: {
    color: "#AAAAAA",
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  valueDark: {
    color: "#FFFFFF",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  subtitleDark: {
    color: "#888888",
  },
  badge: {
    backgroundColor: "#EAF4E7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
  },
  badgeDark: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E5819",
  },
  badgeTextDark: {
    color: "#FFFFFF",
  },
});
