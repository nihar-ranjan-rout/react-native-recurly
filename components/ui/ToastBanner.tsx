import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "@/constants/theme";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastBannerProps {
  message: string | null;
  type?: ToastType;
  onDismiss: () => void;
}

export default function ToastBanner({
  message,
  type = "success",
  onDismiss,
}: ToastBannerProps) {
  if (!message) return null;

  const config = {
    success: {
      bg: theme.colors.successBg,
      border: theme.colors.successBorder,
      text: theme.colors.successText,
      icon: "checkmark-circle" as const,
      iconColor: theme.colors.success,
    },
    error: {
      bg: theme.colors.errorBg,
      border: theme.colors.errorBorder,
      text: theme.colors.errorText,
      icon: "alert-circle" as const,
      iconColor: theme.colors.error,
    },
    warning: {
      bg: theme.colors.warningBg,
      border: theme.colors.warningBorder,
      text: theme.colors.warningText,
      icon: "warning" as const,
      iconColor: theme.colors.warning,
    },
    info: {
      bg: theme.colors.primaryLight,
      border: theme.colors.primaryBorder,
      text: theme.colors.primary,
      icon: "information-circle" as const,
      iconColor: theme.colors.primary,
    },
  }[type];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        <Ionicons name={config.icon} size={18} color={config.iconColor} />
        <Text style={[styles.text, { color: config.text }]}>{message}</Text>
      </View>
      <Pressable
        onPress={onDismiss}
        style={styles.closeBtn}
        accessibilityLabel="Dismiss notification"
      >
        <Ionicons name="close" size={16} color={config.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
    ...theme.shadows.subtle,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  text: {
    fontSize: 13.5,
    fontWeight: "600",
    flex: 1,
  },
  closeBtn: {
    padding: 4,
    borderRadius: theme.borderRadius.sm,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
});
