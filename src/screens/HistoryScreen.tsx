import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../utils/theme";

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>History</Text>
      <View style={styles.center}>
        <Text style={styles.muted}>Date filter and past doses will appear here (Stage 5).</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  title: { fontSize: 26, fontWeight: "800", color: colors.primaryDark },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted, textAlign: "center" },
});