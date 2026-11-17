import "@/global.css";

import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppBackground from "@/components/ui/AppBackground";
import Badge from "@/components/ui/Badge";
import { theme } from "@/constants/theme";
import { resetPassword, signInAdmin, signInUser } from "@/lib/auth";

export default function SignIn() {
  const router = useRouter();
  const params = useLocalSearchParams<{ demo?: string }>();

  const [email, setEmail] = useState(
    params.demo === "admin"
      ? "admin@recurly.app"
      : params.demo === "user"
      ? "nihar@example.com"
      : ""
  );
  const [password, setPassword] = useState(
    params.demo === "admin"
      ? "admin123"
      : params.demo === "user"
      ? "password123"
      : ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<
    "email" | "password" | null
  >(null);

  const handleDemoFill = (type: "user" | "admin") => {
    if (type === "admin") {
      setEmail("admin@recurly.app");
      setPassword("admin123");
    } else {
      setEmail("nihar@example.com");
      setPassword("password123");
    }
    setFormError(null);
    setFormSuccess(null);
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter your email above to receive a password reset link.");
      return;
    }
    setFormError(null);
    try {
      await resetPassword(email);
      setFormSuccess("A secure password reset link has been dispatched to your email.");
    } catch (err: any) {
      setFormError(err.message || "Failed to initiate password reset.");
    }
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;

    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setFormError("Please enter your password.");
      return;
    }

    if (!email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Server-seeded master admin
      if (normalizedEmail === "admin@recurly.app") {
        await signInAdmin({ email, password });
        router.replace("/admin" as any);
      } else {
        const session = await signInUser({ email, password });
        if (session.role === "admin") {
          router.replace("/admin" as any);
        } else {
          router.replace("/app" as any);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in right now. Please try again.";

      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerContainer}>
              {/* TOP NAVIGATION ROW */}
              <View style={styles.topNavRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace("/auth-choice");
                    }
                  }}
                  accessibilityLabel="Go back"
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={theme.colors.text}
                  />
                </Pressable>

                <Badge label="256-Bit SSL" variant="primary" dot />
              </View>

              {/* CENTERED SAAS CARD */}
              <View style={styles.card}>
                {/* BRAND HEADER */}
                <View style={styles.header}>
                  <View style={styles.logoBadge}>
                    <Ionicons name="layers" size={26} color="#FFFFFF" />
                  </View>

                  <Badge label="RECURLY ACCESS" variant="primary" />

                  <Text style={styles.title}>Welcome Back</Text>
                  <Text style={styles.subtitle}>
                    Sign in to your Recurly account
                  </Text>
                </View>

                {/* INLINE FORM ERROR BANNER */}
                {formError ? (
                  <View style={styles.formErrorBanner}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* INLINE FORM SUCCESS BANNER */}
                {formSuccess ? (
                  <View style={styles.formSuccessBanner}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.formSuccessText}>{formSuccess}</Text>
                  </View>
                ) : null}

                {/* EMAIL INPUT */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "email" && styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={
                        focusedInput === "email"
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={theme.colors.inputPlaceholder}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (formError) setFormError(null);
                        if (formSuccess) setFormSuccess(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* PASSWORD INPUT */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedInput === "password" &&
                        styles.inputWrapperFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={
                        focusedInput === "password"
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.colors.inputPlaceholder}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (formError) setFormError(null);
                        if (formSuccess) setFormSuccess(null);
                      }}
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={18}
                        color={theme.colors.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* FORGOT PASSWORD ACTION */}
                <View style={styles.forgotPasswordRow}>
                  <Pressable onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </Pressable>
                </View>

                {/* PRIMARY SIGN IN BUTTON */}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSignIn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </Pressable>

                {/* 1-CLICK DEMO FILL */}
                <View style={styles.demoBox}>
                  <View style={styles.demoHeader}>
                    <View style={styles.demoHeaderTitleRow}>
                      <Ionicons name="flash" size={13} color={theme.colors.primary} />
                      <Text style={styles.demoTitle}>1-Click Demo Fill</Text>
                    </View>
                    <Text style={styles.demoSubtitle}>Tap to auto-fill sample credentials</Text>
                  </View>

                  <View style={styles.demoBtnRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.demoPill,
                        email === "nihar@example.com" && styles.demoPillActive,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => handleDemoFill("user")}
                      accessibilityLabel="Autofill Subscriber demo credentials"
                    >
                      <Ionicons
                        name="person-circle"
                        size={18}
                        color={theme.colors.primary}
                      />
                      <View style={styles.demoPillContent}>
                        <Text style={styles.demoPillRole}>Subscriber Demo</Text>
                        <Text style={styles.demoPillCreds} numberOfLines={1}>nihar@example.com</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.demoPill,
                        styles.demoPillAdmin,
                        email === "admin@recurly.app" && styles.demoPillActiveAdmin,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => handleDemoFill("admin")}
                      accessibilityLabel="Autofill Admin demo credentials"
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color={theme.colors.darkNavy}
                      />
                      <View style={styles.demoPillContent}>
                        <Text style={styles.demoPillRoleAdmin}>Admin Demo</Text>
                        <Text style={styles.demoPillCreds} numberOfLines={1}>admin@recurly.app</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* SIGN UP SWITCH ROW */}
                <View style={styles.signupContainer}>
                  <Text style={styles.accountText}>
                    {"Don't have an account?"}
                  </Text>
                  <Pressable onPress={() => router.push("/(auth)/sign-up")}>
                    <Text style={styles.signupText}>Create Account</Text>
                  </Pressable>
                </View>

                {/* FOOTNOTE */}
                <View style={styles.footerNote}>
                  <Ionicons
                    name="lock-closed"
                    size={12}
                    color={theme.colors.textMuted}
                  />
                  <Text style={styles.footerNoteText}>
                    Bank-grade 256-bit encryption • Offline-first storage
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  centerContainer: {
    width: "100%",
    maxWidth: 440,
  },
  topNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  // CARD
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 28,
    paddingVertical: 32,
    ...theme.shadows.modal,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...theme.shadows.subtle,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 290,
  },

  // ERROR BANNER
  formErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  formErrorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "500",
    color: "#DC2626",
    lineHeight: 18,
  },
  formSuccessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  formSuccessText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    color: theme.colors.successText,
    lineHeight: 18,
  },
  forgotPasswordRow: {
    alignItems: "flex-end",
    marginBottom: 12,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },

  // INPUTS
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputWrapper: {
    height: 48,
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    ...(Platform.OS === "web"
      ? ({ transition: "border-color 0.15s ease, box-shadow 0.15s ease" } as any)
      : {}),
  },
  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
        } as any)
      : {}),
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    height: "100%",
  },
  eyeBtn: {
    padding: 6,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },

  // SUBMIT
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
  },

  // DEMO BOX
  demoBox: {
    marginTop: 18,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  demoHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: 0.3,
  },
  demoSubtitle: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  demoBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  demoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  demoPillAdmin: {
    backgroundColor: theme.colors.card,
  },
  demoPillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#EFF6FF",
  },
  demoPillActiveAdmin: {
    borderColor: theme.colors.darkNavy,
    backgroundColor: "#F1F5F9",
  },
  demoPillContent: {
    flex: 1,
  },
  demoPillRole: {
    fontSize: 11.5,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  demoPillRoleAdmin: {
    fontSize: 11.5,
    fontWeight: "700",
    color: theme.colors.darkNavy,
  },
  demoPillCreds: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 1,
  },

  // SWITCH
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  accountText: {
    color: theme.colors.textSecondary,
    fontSize: 13.5,
  },
  signupText: {
    color: theme.colors.primary,
    fontSize: 13.5,
    fontWeight: "700",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },

  // FOOTER
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    marginTop: 20,
    paddingTop: 16,
  },
  footerNoteText: {
    fontSize: 11.5,
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
});
