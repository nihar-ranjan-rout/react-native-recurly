import React from "react";
import { Platform, StyleSheet, View, ViewProps } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

interface AppBackgroundProps extends ViewProps {
  children?: React.ReactNode;
  hideDecorations?: boolean;
}

export default function AppBackground({
  children,
  style,
  hideDecorations = false,
  ...props
}: AppBackgroundProps) {
  const isWeb = Platform.OS === "web";

  return (
    <View style={[styles.container, style]} {...props}>
      <StatusBar style="dark" />

      {/* Layer 1: Soft Mint-Green Linear Gradient */}
      <LinearGradient
        colors={["#DDEBE5", "#E4EFEA", "#D8E8E1", "#DDEBE5"]}
        locations={[0, 0.4, 0.8, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Layer 2: Subtle Organic Decorative Elements */}
      {!hideDecorations && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Subtle architectural dot pattern */}
          <View style={styles.gridOverlay} />

          {/* Top-Right Soft Coral/Orange Warm Glow */}
          <View
            style={[
              styles.glowOrbTop,
              isWeb && ({ className: "saas-orb-top" } as any),
            ]}
          />

          {/* Bottom-Left Soft Mint/Sage Glow */}
          <View
            style={[
              styles.glowOrbBottom,
              isWeb && ({ className: "saas-orb-bottom" } as any),
            ]}
          />

          {/* Clean minimal geometric hairline rings */}
          <View style={styles.subtleGeometricRing} />
        </View>
      )}

      {/* Layer 3: Main Application Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(#C6DDD4 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 20%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 20%, black 30%, transparent 80%)",
          opacity: 0.5,
          pointerEvents: "none",
        } as any)
      : {}),
  },
  glowOrbTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 440,
    height: 440,
    borderRadius: 220,
    pointerEvents: "none",
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(circle, rgba(242, 140, 69, 0.08) 0%, rgba(255, 253, 245, 0.15) 45%, transparent 70%)",
        } as any)
      : {
          backgroundColor: "rgba(242, 140, 69, 0.04)",
        }),
  },
  glowOrbBottom: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 480,
    height: 480,
    borderRadius: 240,
    pointerEvents: "none",
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(circle, rgba(183, 217, 168, 0.15) 0%, rgba(221, 235, 229, 0.2) 40%, transparent 70%)",
        } as any)
      : {
          backgroundColor: "rgba(183, 217, 168, 0.08)",
        }),
  },
  subtleGeometricRing: {
    position: "absolute",
    top: -160,
    right: -100,
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: "rgba(233, 230, 220, 0.5)",
    pointerEvents: "none",
  },
});
