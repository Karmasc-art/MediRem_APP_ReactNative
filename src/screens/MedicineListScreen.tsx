import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { Medicine, describeDuration } from "../types/medicine";
import { useAuth } from "../services/AuthContext";
import { listMedicines } from "../database/medicineRepository";
import MedicineCard from "../components/MedicineCard";
import ErrorMessage from "../components/ErrorMessage";
import { reportError } from "../utils/errorHandler";
import { colors, radius, shadow, spacing } from "../utils/theme";

export default function MedicineListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Medicine[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setItems(await listMedicines(user.uid, query));
      setError(null);
    } catch (e) {
      reportError("list medicines", e);
      setError("Could not load your medicines.");
    }
  }, [user, query]);

  // Runs on focus and whenever the query changes, so search is live.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>My Medicines</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.search}
          placeholder="Search medicines..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <ErrorMessage message={error} />

      <FlatList
        data={items}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item}
            caption={describeDuration(item.durationDays)}
            onPress={() => navigation.navigate("MedicineDetails", { medicineId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="medkit-outline" size={40} color={colors.accent} />
            <Text style={styles.muted}>
              {query ? "No medicines match your search." : "No medicines yet. Tap + to add one."}
            </Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddMedicine")}>
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  title: { fontSize: 26, fontWeight: "800", color: colors.primaryDark, marginBottom: spacing.md },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  search: { flex: 1, padding: 12, fontSize: 16 },
  list: { paddingBottom: 110, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  muted: { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" },
  fab: {
    position: "absolute", right: 20, bottom: 24, width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow,
  },
});