// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppContext } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="legal" options={{ title: "Legal & Ethical Duties" }} />
      <Stack.Screen name="fraud-basics" options={{ title: "Fraud Basics" }} />
      <Stack.Screen name="scenarios" options={{ title: "Fraud Scenarios" }} />
      <Stack.Screen name="scenario-detail" options={{ title: "Scenario Details" }} />
      <Stack.Screen name="red-flags" options={{ title: "Red Flags Radar" }} />
      <Stack.Screen name="checklists" options={{ title: "Approval Checklists" }} />
      <Stack.Screen name="authority" options={{ title: "Delegated Authority" }} />
      <Stack.Screen name="reporting" options={{ title: "Report Fraud" }} />
      <Stack.Screen name="whistleblower" options={{ title: "Whistleblower Protection" }} />
      <Stack.Screen name="myths" options={{ title: "Myths vs Reality" }} />
      <Stack.Screen name="pledge" options={{ title: "Your Commitment" }} />
      <Stack.Screen name="resources" options={{ title: "Resources & Support" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext>
        <GestureHandlerRootView>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AppContext>
    </QueryClientProvider>
  );
}
