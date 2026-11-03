import React, { useCallback, useLayoutEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { Medicine, describeDuration } from "../types/medicine";
import { useAuth } from "../services/AuthContext";
import { deleteMedicine, getMedicine } from "../database/medicineRepository";
import ErrorMessage from "../components/ErrorMessage";
import LoadingView from "../components/LoadingView";
import { addDays, formatDateLong, formatTime } from "../utils/dateUtils";
import { reportError } from "../utils/errorHandler";
import { colors, radius, shadow, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "MedicineDetails">;

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function MedicineDetailsScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { medicineId } = route.params;
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setMedicine(await getMedicine(user.uid, medicineId));
      setError(null);
    } catch (e) {
      reportError("load medicine details", e);
      setError("Could not load this medicine.");
    } finally {
      setLoading(false);
    }
  }, [user, medicineId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = useCallback(() => {
    if (!user || !medicine) return;
    Alert.alert("Delete medicine", `Delete ${medicine.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMedicine(user.uid, medicine.id);
            navigation.goBack();
          } catch (e) {
            reportError("delete medicine", e);
            setError("Could not delete the medicine. Please try again.");
          }
        },
      },
    ]);
  }, [user, medicine, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        medicine ? (
          <View style={styles.headerButtons}>
            <Pressable onPress={() => navigation.navigate("AddMedicine", { medicineId: medicine.id })} hitSlop={8}>
              <Ionicons name="create-outline" size={24} color={colors.white} />
            </Pressable>
            <Pressable onPress={confirmDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={24} color={colors.white} />
            </Pressable>
          </View>
        ) : null,
    });
  }, [navigation, medicine, confirmDelete]);

  if (loading) return <LoadingView />;

  if (!medicine) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color={colors.textMuted} />
        <Text style={styles.muted}>{error ?? "This medicine no longer exists."}</Text>
      </View>
    );
  }

  const schedule =
    medicine.durationDays === 0
      ? `From ${formatDateLong(medicine.startDate)}, every day`
      : `${formatDateLong(medicine.startDate)} to ${formatDateLong(addDays(medicine.startDate, medicine.durationDays - 1))}`;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.top}>
        {medicine.photoUri ? (
          <Image source={{ uri: medicine.photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Ionicons name="medkit" size={48} color={colors.primary} />
          </View>
        )}
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.dosage}>{medicine.dosage} • {medicine.type}</Text>
      </View>

      <ErrorMessage message={error} />

      <View style={styles.card}>
        <Row icon="time-outline" label="Schedule time" value={formatTime(medicine.scheduleTime)} />
        <Row icon="calendar-outline" label="Schedule" value={schedule} />
        <Row icon="repeat-outline" label="Duration" value={describeDuration(medicine.durationDays)} />
        <Row icon="document-text-outline" label="Note" value={medicine.notes || "No note added"} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 60 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.lg },
  muted: { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" },
  headerButtons: { flexDirection: "row", gap: 18 },
  top: { alignItems: "center", marginBottom: spacing.md },
  photo: { width: 130, height: 130, borderRadius: radius.lg },
  photoEmpty: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 26, fontWeight: "800", color: colors.primaryDark, marginTop: spacing.md, textAlign: "center" },
  dosage: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, ...shadow },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  rowText: { marginLeft: spacing.md, flex: 1 },
  rowLabel: { fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 15, color: colors.text, marginTop: 2 },
});