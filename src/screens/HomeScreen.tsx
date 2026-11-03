import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { Medicine } from "../types/medicine";
import { useAuth } from "../services/AuthContext";
import { listMedicines, listMedicinesForDate } from "../database/medicineRepository";
import MedicineCard from "../components/MedicineCard";
import ErrorMessage from "../components/ErrorMessage";
import { greeting, todayString } from "../utils/dateUtils";
import { reportError } from "../utils/errorHandler";
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
  const [today, setToday] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setToday(await listMedicinesForDate(user.uid, todayString()));
      setTotal((await listMedicines(user.uid)).length);
      setError(null);
    } catch (e) {
      reportError("load today's medicines", e);
      setError("Could not load today's medicines.");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()}{firstName ? `, ${firstName}` : ""} 👋</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Today's overview</Text>
        <View style={styles.statsRow}>
          <StatCard label="Scheduled today" value={today.length} color={colors.primary} icon="alarm-outline" />
          <StatCard label="All medicines" value={total} color={colors.accent} icon="medkit-outline" />
        </View>

        <Text style={styles.sectionTitle}>Today's medicines</Text>
        <ErrorMessage message={error} />
        {today.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={40} color={colors.accent} />
            <Text style={styles.emptyText}>No medicines scheduled today.</Text>
            <Text style={styles.emptyHint}>Tap + to add a medicine.</Text>
          </View>
        ) : (
          today.map((m) => (
            <MedicineCard
              key={m.id}
              medicine={m}
              onPress={() => navigation.navigate("MedicineDetails", { medicineId: m.id })}
            />
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddMedicine")}>
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 110 },
  header: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  greeting: { fontSize: 24, fontWeight: "800", color: colors.white },
  email: { fontSize: 14, color: "#C8E6C9", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginVertical: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: "center", ...shadow },
  statValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  empty: { alignItems: "center", backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.xl, ...shadow },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: spacing.sm },
  emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow,
  },
});