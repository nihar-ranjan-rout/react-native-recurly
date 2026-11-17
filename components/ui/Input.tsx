import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { theme } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          Boolean(error) && styles.inputWrapperError,
        ]}
      >
        {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.inputPlaceholder}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.iconWrap}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  inputWrapper: {
    height: 48,
    backgroundColor: theme.colors.inputBg, // #FFFDF5
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder, // #E9E6DC
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    ...(Platform.OS === "web"
      ? ({ transition: "border-color 0.15s ease, box-shadow 0.15s ease" } as any)
      : {}),
  },
  inputWrapperFocused: {
    borderColor: theme.colors.accent,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 0 0 3px rgba(242, 140, 69, 0.15)",
        } as any)
      : {}),
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: theme.colors.text,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: "500",
    marginTop: 4,
  },
});
