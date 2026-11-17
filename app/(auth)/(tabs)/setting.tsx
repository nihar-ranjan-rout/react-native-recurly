import React, { useEffect, useState } from "react";
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
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { theme } from "@/constants/theme";
import { getSession, signOut, UserSession } from "@/lib/auth";

export default function Setting() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const currentSession = await getSession();
      setSession(currentSession);
    };

    loadSession();
  }, []);

  const handleLogout = async () => {
    setShowSignOutConfirm(false);
    await signOut();
    router.dismissAll();
    router.replace("/(auth)/sign-in");
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* HEADER ROW */}
            <View style={styles.headerRow}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={theme.colors.text}
                />
              </Pressable>
              <Text style={styles.headerTitle}>System Settings</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* MEMBER IDENTITY CARD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>AUTHENTICATED MEMBER</Text>
                  <Text style={styles.name}>{session?.name ?? "User Member"}</Text>
                  <Text style={styles.email}>
                    {session?.email ?? "subscriber@recurly.app"}
                  </Text>
                </View>
                <Badge
                  label="MEMBER"
                  variant="neutral"
                />
              </View>
            </View>

            {/* SECURITY & DATA POLICY CARD */}
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>SECURITY & PRIVACY</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.settingItemText}>Local Encrypted Storage</Text>
                </View>
                <Badge label="ENABLED" variant="success" />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.settingItemText}>Zero Third-Party Telemetry</Text>
                </View>
                <Badge label="ACTIVE" variant="success" />
              </View>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <View style={styles.settingItemLeft}>
                  <Ionicons
                    name="server-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.settingItemText}>Client Platform Engine</Text>
                </View>
                <Text style={styles.settingItemValue}>Expo 54 / React 19</Text>
              </View>
            </View>

            {/* SIGN OUT ACTION */}
            <Pressable
              style={styles.logoutButton}
              onPress={() => setShowSignOutConfirm(true)}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.colors.error}
              />
              <Text style={styles.logoutButtonText}>Sign Out of Recurly</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* CONFIRMATION DIALOG */}
        <ConfirmModal
          visible={showSignOutConfirm}
          title="Sign Out"
          message="Are you sure you want to end your current session?"
          confirmLabel="Sign Out"
          variant="danger"
          onConfirm={handleLogout}
          onCancel={() => setShowSignOutConfirm(false)}
        />
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
    paddingBottom: 40,
  },
  container: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 18,
    ...theme.shadows.subtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10.5,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  email: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingItemText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: theme.colors.text,
  },
  settingItemValue: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    height: 48,
    marginTop: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  logoutButtonText: {
    color: theme.colors.errorText,
    fontSize: 13.5,
    fontWeight: "700",
  },
});