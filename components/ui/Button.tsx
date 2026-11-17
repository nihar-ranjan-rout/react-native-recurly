import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { theme } from "@/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        pressed && isInteractive && styles[`${variant}Pressed`],
        !isInteractive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" || variant === "accent" ? "#FFFFFF" : theme.colors.textSecondary
          }
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text`],
              styles[`${size}Text`],
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.md,
    gap: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
    ...(Platform.OS === "web" ? ({ cursor: "not-allowed" } as any) : {}),
  },

  // VARIANTS
  primary: {
    backgroundColor: theme.colors.primary, // #171717
    ...theme.shadows.subtle,
  },
  primaryPressed: {
    backgroundColor: theme.colors.primaryHover, // #2A2A2A
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  accent: {
    backgroundColor: theme.colors.accent, // #F28C45
    ...theme.shadows.subtle,
  },
  accentPressed: {
    backgroundColor: theme.colors.accentHover,
  },
  accentText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  secondary: {
    backgroundColor: theme.colors.card, // #FFFDF5
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    ...theme.shadows.subtle,
  },
  secondaryPressed: {
    backgroundColor: "#F5F0E4",
    borderColor: theme.colors.inputBorder,
  },
  secondaryText: {
    color: theme.colors.text, // #171717
    fontWeight: "700",
  },

  danger: {
    backgroundColor: theme.colors.errorBg,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
  },
  dangerPressed: {
    backgroundColor: "#FCA5A5",
  },
  dangerText: {
    color: theme.colors.errorText,
    fontWeight: "700",
  },

  ghost: {
    backgroundColor: "transparent",
  },
  ghostPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  ghostText: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },

  // SIZES
  sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  smText: {
    fontSize: 13,
  },
  md: {
    height: 44,
    paddingHorizontal: 16,
  },
  mdText: {
    fontSize: 14,
  },
  lg: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.lg,
  },
  lgText: {
    fontSize: 15,
  },

  textBase: {
    letterSpacing: -0.1,
  },
});
