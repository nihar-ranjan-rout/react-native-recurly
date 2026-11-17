import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import AppBackground from "@/components/ui/AppBackground";
import Illustration from "@/components/ui/Illustration";
import { theme } from "@/constants/theme";

const features = [
  {
    icon: "search-outline" as const,
    title: "Portfolio Discovery",
    description: "Connect and catalog all your active subscriptions and recurring bills.",
    color: theme.colors.accent,
    bgColor: theme.colors.accentLight,
  },
  {
    icon: "flash-outline" as const,
    title: "Predictive Run-Rate",
    description: "Accurate monthly outflow tracking and annual spend projections.",
    color: "#2E7D32",
    bgColor: "#EAF4E7",
  },
  {
    icon: "notifications-outline" as const,
    title: "Proactive Alerts",
    description: "Smart reminders sent 48 hours before any auto-renewal charges.",
    color: theme.colors.accent,
    bgColor: theme.colors.accentLight,
  },
  {
    icon: "trending-down-outline" as const,
    title: "Expense Control",
    description: "Spot unused plans, cancel forgotten trials, and optimize spend.",
    color: "#2E7D32",
    bgColor: "#EAF4E7",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const goToAuthChoice = () => {
    router.push("/auth-choice");
  };

  const goToSignIn = () => {
    router.push("/(auth)/sign-in");
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* Back Button */}
            {step === 1 && (
              <Pressable
                style={styles.backButton}
                onPress={() => setStep(0)}
                accessibilityLabel="Back"
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            )}

            {/* Brand Header */}
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText}>recurly</Text>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>Fintech Edition</Text>
              </View>
            </View>

            {/* STEP 0: Welcome Screen */}
            {step === 0 ? (
              <View style={styles.stepContainer}>
                {/* Modern Abstract Geometric Illustration Graphic */}
                <View style={styles.artworkWrap}>
                  <View style={styles.abstractShapeOuter}>
                    <View style={styles.abstractShapeMiddle}>
                      <Illustration
                        name="onboarding-track"
                        width={240}
                        height={190}
                      />
                    </View>
                  </View>

                  {/* Floating Metric Pill */}
                  <View style={styles.floatingPill}>
                    <View style={styles.floatingPillDot} />
                    <Text style={styles.floatingPillText}>Total active: $78.96/mo</Text>
                  </View>
                </View>

                {/* Copy Block */}
                <View style={styles.copyBlock}>
                  <Text style={styles.eyebrow}>SUBSCRIPTION INTELLIGENCE</Text>
                  <Text style={styles.heroTitle}>
                    Streamline your{"\n"}subscriptions.
                  </Text>
                  <Text style={styles.description}>
                    The smart, effortless way to track recurring bills, forecast renewals, and take full control of your financial outflow.
                  </Text>
                </View>

                {/* Progress Indicators */}
                <View style={[styles.progressRow, { marginBottom: 20 }]}>
                  <View style={styles.progressActive} />
                  <View style={styles.progressInactive} />
                </View>

                {/* Primary CTA */}
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>

                {/* Sign In Link */}
                <View style={styles.signInRow}>
                  <Text style={styles.mutedText}>Already have an account?</Text>
                  <Pressable onPress={goToSignIn} hitSlop={8}>
                    <Text style={styles.linkText}>Sign In</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* STEP 1: Feature Overview */
              <View style={styles.stepContainer}>
                {/* Copy Block */}
                <View style={styles.copyBlock}>
                  <Text style={styles.eyebrow}>FINANCIAL CLARITY</Text>
                  <Text style={styles.pageTitle}>
                    Take Control of{"\n"}Your Outflow
                  </Text>
                  <Text style={styles.description}>
                    Everything you need to manage your personal and business subscriptions in one place.
                  </Text>
                </View>

                {/* Features List */}
                <View style={styles.featureList}>
                  {features.map((feature) => (
                    <View key={feature.title} style={styles.featureCard}>
                      <View
                        style={[
                          styles.featureIcon,
                          { backgroundColor: feature.bgColor },
                        ]}
                      >
                        <Ionicons
                          name={feature.icon}
                          size={20}
                          color={feature.color}
                        />
                      </View>
                      <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>
                          {feature.title}
                        </Text>
                        <Text style={styles.featureDescription}>
                          {feature.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Footer Controls */}
                <View style={styles.footerWrap}>
                  {/* Step Progress Indicators */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressInactive} />
                    <View style={styles.progressActive} />
                  </View>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={goToAuthChoice}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: Platform.OS === "web" ? "center" : undefined,
  },
  contentContainer: {
    width: "100%",
    maxWidth: 480,
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
    marginBottom: 12,
    alignSelf: "flex-start",
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primary, // #171717
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandBadge: {
    backgroundColor: theme.colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.accentBorder,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accentText,
  },

  stepContainer: {
    width: "100%",
  },

  artworkWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
    position: "relative",
  },
  abstractShapeOuter: {
    padding: 16,
    borderRadius: 36,
    backgroundColor: "rgba(255, 253, 245, 0.6)",
    borderWidth: 1,
    borderColor: "#E9E6DC",
  },
  abstractShapeMiddle: {
    padding: 12,
    borderRadius: 28,
    backgroundColor: "#FFFDF5",
    borderWidth: 1,
    borderColor: "#E9E6DC",
    ...theme.shadows.card,
  },
  floatingPill: {
    position: "absolute",
    bottom: -8,
    backgroundColor: theme.colors.primary, // #171717
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...theme.shadows.card,
  },
  floatingPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent, // #F28C45
  },
  floatingPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  copyBlock: {
    marginTop: 22,
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: theme.colors.accentText,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    letterSpacing: -0.6,
    color: theme.colors.text,
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    letterSpacing: -0.5,
    color: theme.colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary, // #171717
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all 0.15s ease" } as any) : {}),
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
  },
  mutedText: {
    fontSize: 13.5,
    color: theme.colors.textSecondary,
  },
  linkText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: theme.colors.accent,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },

  // FEATURES
  featureList: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder, // #E9E6DC
    ...theme.shadows.subtle,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // FOOTER WRAP
  footerWrap: {
    gap: 16,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  progressActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  progressInactive: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C6DDD4",
  },
});