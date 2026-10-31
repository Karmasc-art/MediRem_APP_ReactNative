import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../utils/theme";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notification settings (Stage 4)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  text: { color: colors.textMuted },
});