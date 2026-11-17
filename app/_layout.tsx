import "@/global.css";
import { Stack } from "expo-router";
import { CurrencyProvider } from "@/context/CurrencyContext";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  return (
    <CurrencyProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth-choice" />
        <Stack.Screen name="admin" />
      </Stack>
    </CurrencyProvider>
  );
}
