import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { DoseItem } from "../types/medicine";
import { useAuth } from "../services/AuthContext";
import { getDosesForDate, markTaken } from "../database/historyRepository";
import MedicineCard from "../components/MedicineCard";
import ErrorMessage from "../components/ErrorMessage";
import { formatTime, greeting, todayString } from "../utils/dateUtils";
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
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setDoses(await getDosesForDate(user.uid, todayString()));
      setError(null);
    } catch (e) {
      reportError("load today's medicines", e);
      setError("Could not load today's medicines.");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Upcoming doses turn into "missed" as time passes, so refresh every minute.
  useEffect(() => {
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const handleTaken = async (item: DoseItem) => {
    try {
      await markTaken(item.medicine.id, item.date);
      await load();
    } catch (e) {
      reportError("mark taken", e);
      setError("Could not update the status. Please try again.");
    }
  };

  const count = (s: DoseItem["status"]) => doses.filter((d) => d.status === s).length;
  const next = doses.find((d) => d.status === "upcoming");
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
          <View style={styles.nextBox}>
            <Ionicons name="alarm" size={18} color={colors.primaryDark} />
            <Text style={styles.nextText} numberOfLines={1}>
              {next
                ? `Next: ${next.medicine.name} at ${formatTime(next.medicine.scheduleTime)}`
                : doses.length > 0
                  ? "No more doses today 🎉"
                  : "Nothing scheduled today"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's overview</Text>
        <View style={styles.statsRow}>
          <StatCard label="To take" value={count("upcoming")} color={colors.warning} icon="alarm-outline" />
          <StatCard label="Taken" value={count("taken")} color={colors.primary} icon="checkmark-circle-outline" />
          <StatCard label="Missed" value={count("missed")} color={colors.danger} icon="close-circle-outline" />
        </View>

        <Text style={styles.sectionTitle}>Today's medicines</Text>
        <ErrorMessage message={error} />
        {doses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={40} color={colors.accent} />
            <Text style={styles.emptyText}>No medicines scheduled today.</Text>
            <Text style={styles.emptyHint}>Tap + to add a medicine.</Text>
          </View>
        ) : (
          doses.map((item) => (
            <MedicineCard
              key={item.medicine.id}
              medicine={item.medicine}
              status={item.status}
              onPress={() => navigation.navigate("MedicineDetails", { medicineId: item.medicine.id })}
              onStatusPress={item.status === "taken" ? undefined : () => handleTaken(item)}
            />
          ))
        )}
        {doses.some((d) => d.status !== "taken") ? (
          <Text style={styles.tip}>Tap Upcoming or Missed to mark a dose as taken.</Text>
        ) : null}
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
  nextBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14, marginTop: spacing.md,
  },
  nextText: { marginLeft: 8, color: colors.primaryDark, fontWeight: "700", flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginVertical: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, alignItems: "center", ...shadow },
  statValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  empty: { alignItems: "center", backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.xl, ...shadow },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: spacing.sm },
  emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  tip: { textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow,
  },
});