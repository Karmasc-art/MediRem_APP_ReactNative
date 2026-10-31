import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../services/AuthContext";
import { greeting } from "../utils/dateUtils";
import { colors, radius, shadow, spacing } from "../utils/theme";

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()}{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Today's overview</Text>
        <View style={styles.statsRow}>
          <StatCard label="To take" value={0} color={colors.warning} icon="alarm-outline" />
          <StatCard label="Taken" value={0} color={colors.primary} icon="checkmark-circle-outline" />
          <StatCard label="Missed" value={0} color={colors.danger} icon="close-circle-outline" />
        </View>

        <Text style={styles.sectionTitle}>Today's medicines</Text>
        <View style={styles.empty}>
          <Ionicons name="leaf-outline" size={40} color={colors.accent} />
          <Text style={styles.emptyText}>No medicines scheduled yet.</Text>
          <Text style={styles.emptyHint}>Tap + to add your first medicine.</Text>
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddMedicine")}>
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 100 },
  header: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  greeting: { fontSize: 24, fontWeight: "800", color: colors.white },
  email: { fontSize: 14, color: "#C8E6C9", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginVertical: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, alignItems: "center", ...shadow,
  },
  statValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  empty: {
    alignItems: "center", backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.xl, ...shadow,
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: spacing.sm },
  emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 62, height: 62,
    borderRadius: 31, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center", ...shadow,
  },
});