import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import { AuthProvider } from "@/contexts/AuthContext";


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#003078',
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "FRA Health Check", headerShown: false }}
      />
      <Stack.Screen
        name="organisation"
        options={{ title: "Organisation Details" }}
      />
      <Stack.Screen
        name="risk-appetite"
        options={{ title: "Risk Appetite" }}
      />
      <Stack.Screen
        name="fraud-triangle"
        options={{ title: "Fraud Triangle" }}
      />
      <Stack.Screen
        name="procurement"
        options={{ title: "Procurement" }}
      />
      <Stack.Screen
        name="cash-banking"
        options={{ title: "Cash & Banking" }}
      />
      <Stack.Screen
        name="payroll-hr"
        options={{ title: "Payroll & HR" }}
      />
      <Stack.Screen
        name="revenue"
        options={{ title: "Revenue" }}
      />
      <Stack.Screen
        name="it-systems"
        options={{ title: "IT Systems" }}
      />
      <Stack.Screen
        name="people-culture"
        options={{ title: "People & Culture" }}
      />
      <Stack.Screen
        name="controls-technology"
        options={{ title: "Controls & Technology" }}
      />
      <Stack.Screen
        name="priorities"
        options={{ title: "Your Priorities" }}
      />
      <Stack.Screen
        name="review"
        options={{ title: "Review Answers" }}
      />
      <Stack.Screen
        name="packages"
        options={{ title: "Choose Package" }}
      />
      <Stack.Screen
        name="payment"
        options={{ title: "Payment" }}
      />
      <Stack.Screen
        name="confirmation"
        options={{ title: "Success", headerLeft: () => null }}
      />
      <Stack.Screen
        name="signature"
        options={{ title: "Sign Assessment" }}
      />
      <Stack.Screen
        name="feedback"
        options={{ title: "Your Feedback" }}
      />
      <Stack.Screen
        name="dashboard"
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="payments-module"
        options={{ title: "Payments Module" }}
      />
      <Stack.Screen
        name="training-awareness"
        options={{ title: "Training & Awareness" }}
      />
      <Stack.Screen
        name="monitoring-evaluation"
        options={{ title: "Monitoring & Evaluation" }}
      />
      <Stack.Screen
        name="compliance-mapping"
        options={{ title: "Compliance Mapping" }}
      />
      <Stack.Screen
        name="fraud-response"
        options={{ title: "Fraud Response Plan" }}
      />
      <Stack.Screen
        name="action-plan"
        options={{ title: "Action Plan" }}
      />
      <Stack.Screen
        name="procurement-refactored"
        options={{ title: "Procurement" }}
      />
      <Stack.Screen
        name="risk-appetite-refactored"
        options={{ title: "Risk Appetite" }}
      />
      <Stack.Screen
        name="auth/login"
        options={{ title: "Sign In", headerShown: false }}
      />
      <Stack.Screen
        name="auth/signup"
        options={{ title: "Create Account" }}
      />
      <Stack.Screen
        name="auth/keypass"
        options={{ title: "Company Access Code" }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AssessmentProvider>
            <RootLayoutNav />
          </AssessmentProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
