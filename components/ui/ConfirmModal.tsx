import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "@/constants/theme";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon = "alert-circle-outline",
  onConfirm,
  onCancel,
  confirmLoading = false,
}: ConfirmModalProps) {
  if (!visible) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const iconColor = isDanger
    ? theme.colors.error
    : isWarning
    ? theme.colors.warning
    : theme.colors.primary;

  const iconBg = isDanger
    ? theme.colors.errorBg
    : isWarning
    ? theme.colors.warningBg
    : theme.colors.primaryLight;

  const confirmBtnBg = isDanger
    ? theme.colors.error
    : isWarning
    ? theme.colors.warning
    : theme.colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={styles.modalCard}>
          {/* ICON BADGE */}
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={28} color={iconColor} />
          </View>

          {/* CONTENT */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* ACTION BUTTONS */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onCancel}
              disabled={confirmLoading}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                { backgroundColor: confirmBtnBg },
                pressed && styles.confirmButtonPressed,
                confirmLoading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={confirmLoading}
            >
              <Text style={styles.confirmButtonText}>
                {confirmLoading ? "Processing..." : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(4px)" } as any) : {}),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.modal,
    alignItems: "center",
    zIndex: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  cancelButtonPressed: {
    backgroundColor: theme.colors.inputBorder,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  confirmButtonPressed: {
    opacity: 0.9,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
    ...(Platform.OS === "web" ? ({ cursor: "not-allowed" } as any) : {}),
  },
});
