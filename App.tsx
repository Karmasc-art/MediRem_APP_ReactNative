import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/services/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { logger } from "./src/utils/logger";

export default function App() {
  logger.info("MediRem starting");
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}