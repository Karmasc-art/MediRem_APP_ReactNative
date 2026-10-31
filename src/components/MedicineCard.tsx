import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Medicine, MedicineStatus } from "../types/medicine";
import { colors, radius, shadow, spacing } from "../utils/theme";
import { formatTime } from "../utils/dateUtils";

const statusStyle: Record<MedicineStatus, { bg: string; fg: string; label: string }> = {
  upcoming: { bg: "#FFF8E1", fg: "#F57F17", label: "Upcoming" },
  taken: { bg: colors.primaryLight, fg: colors.primaryDark, label: "Taken" },
  missed: { bg: "#FDECEA", fg: colors.danger, label: "Missed" },
};

interface Props {
  medicine: Medicine;
  onPress: () => void;
  onStatusPress?: () => void;
}

export default function MedicineCard({ medicine, onPress, onStatusPress }: Props) {
  const s = statusStyle[medicine.status];
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {medicine.photoUri ? (
        <Image source={{ uri: medicine.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="medkit" size={26} color={colors.primary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{medicine.name}</Text>
        <Text style={styles.sub}>{medicine.dosage} • {medicine.type}</Text>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={styles.time}>{formatTime(medicine.scheduleTime)}</Text>
        </View>
      </View>

      <Pressable
        onPress={onStatusPress}
        disabled={!onStatusPress || medicine.status !== "upcoming"}
        style={[styles.badge, { backgroundColor: s.bg }]}
      >
        <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    ...shadow,
  },
  photo: { width: 54, height: 54, borderRadius: radius.sm },
  photoPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginHorizontal: spacing.md },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  time: { fontSize: 13, color: colors.textMuted, marginLeft: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: "700" },
});