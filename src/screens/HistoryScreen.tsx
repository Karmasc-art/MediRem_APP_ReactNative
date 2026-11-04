import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { DoseItem, MedicineStatus } from "../types/medicine";
import { useAuth } from "../services/AuthContext";
import { getDosesForDate } from "../database/historyRepository";
import MedicineCard from "../components/MedicineCard";
import DateTimeField from "../components/DateTimeField";
import ErrorMessage from "../components/ErrorMessage";
import { toDateString } from "../utils/dateUtils";
import { reportError } from "../utils/errorHandler";
import { colors, radius, spacing } from "../utils/theme";

type Filter = "all" | MedicineStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "taken", label: "Taken" },
  { key: "missed", label: "Missed" },
  { key: "upcoming", label: "Upcoming" },
];

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dateStr = toDateString(date);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setDoses(await getDosesForDate(user.uid, dateStr, query));
      setError(null);
    } catch (e) {
      reportError("load history", e);
      setError("Could not load history.");
    }
  }, [user, dateStr, query]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shift = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };

  const count = (s: MedicineStatus) => doses.filter((d) => d.status === s).length;
  const visible = filter === "all" ? doses : doses.filter((d) => d.status === filter);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>History</Text>

      <View style={styles.dateRow}>
        <Pressable style={styles.arrow} onPress={() => shift(-1)}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.dateField}>
          <DateTimeField mode="date" value={date} onChange={setDate} />
        </View>
        <Pressable style={styles.arrow} onPress={() => shift(1)}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.primary }]}>{count("taken")} taken</Text>
        <Text style={[styles.summaryText, { color: colors.danger }]}>{count("missed")} missed</Text>
        <Text style={[styles.summaryText, { color: "#F57F17" }]}>{count("upcoming")} upcoming</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.search}
          placeholder="Search this day..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipSelected]}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextSelected]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <ErrorMessage message={error} />

      <FlatList
        data={visible}
        keyExtractor={(d) => `${d.medicine.id}-${d.date}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item.medicine}
            status={item.status}
            onPress={() => navigation.navigate("MedicineDetails", { medicineId: item.medicine.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={40} color={colors.accent} />
            <Text style={styles.muted}>No doses found for this day.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  title: { fontSize: 26, fontWeight: "800", color: colors.primaryDark, marginBottom: spacing.sm },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dateField: { flex: 1 },
  arrow: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  summary: { flexDirection: "row", justifyContent: "space-around", marginVertical: spacing.md },
  summaryText: { fontWeight: "700", fontSize: 14 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  search: { flex: 1, padding: 10, fontSize: 15 },
  filters: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.md },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  chipTextSelected: { color: colors.white },
  list: { paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  muted: { color: colors.textMuted, marginTop: spacing.sm },
});