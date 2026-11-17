import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { colors } from "@/src/ui/tokens";
import Icon from "@/src/ui/Icon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.nearBlack,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardCream,
          borderTopColor: colors.cardBorderWarm,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          elevation: 4,
          shadowColor: "#161616",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          ...(Platform.OS === "web"
            ? ({
                maxWidth: 720,
                alignSelf: "center",
                width: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 -2px 10px 0 rgba(22, 22, 22, 0.05)",
              } as any)
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
          letterSpacing: -0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="home"
              size={22}
              color={focused ? colors.nearBlack : colors.textSecondary}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="subscription/index"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="subscription"
              size={22}
              color={focused ? colors.nearBlack : colors.textSecondary}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="insight"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="analytics"
              size={22}
              color={focused ? colors.nearBlack : colors.textSecondary}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="user"
              size={22}
              color={focused ? colors.nearBlack : colors.textSecondary}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Auxiliary screens hidden from tabs */}
      <Tabs.Screen
        name="subscription/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
