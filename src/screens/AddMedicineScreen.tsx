import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { MEDICINE_TYPES, MedicineInput, MedicineType } from "../types/medicine";
import { useAuth } from "../services/AuthContext";
import {
  addMedicine, getMedicine, setNotificationIds, updateMedicine,
} from "../database/medicineRepository";
import { cancelReminders, scheduleReminders } from "../services/notificationService";
import { pickFromGallery, takePhoto } from "../services/photoService";
import DateTimeField from "../components/DateTimeField";
import ErrorMessage from "../components/ErrorMessage";
import LoadingView from "../components/LoadingView";
import {
  dateTimeFrom, parseDateString, todayString, toDateString, toTimeString,
} from "../utils/dateUtils";
import { validateMedicine } from "../utils/validation";
import { logger } from "../utils/logger";
import { reportError } from "../utils/errorHandler";
import { colors, radius, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddMedicine">;

const DURATIONS = [
  { label: "1 day", value: 1 },
  { label: "3 days", value: 3 },
  { label: "5 days", value: 5 },
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "Every day", value: 0 },
];

function defaultTime(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function AddMedicineScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const editingId = route.params?.medicineId;

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [type, setType] = useState<MedicineType>("Tablet");
  const [time, setTime] = useState<Date>(defaultTime());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState(7);
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!!editingId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editingId ? "Edit Medicine" : "Add Medicine" });
  }, [navigation, editingId]);

  useEffect(() => {
    if (!editingId || !user) return;
    (async () => {
      try {
        const m = await getMedicine(user.uid, editingId);
        if (m) {
          setName(m.name);
          setDosage(m.dosage);
          setType(m.type);
          setTime(dateTimeFrom(todayString(), m.scheduleTime));
          setStartDate(parseDateString(m.startDate));
          setDuration(m.durationDays);
          setNotes(m.notes);
          setPhotoUri(m.photoUri);
        }
      } catch (e) {
        reportError("load medicine for edit", e);
        setError("Could not load this medicine.");
      } finally {
        setLoading(false);
      }
    })();
  }, [editingId, user]);

  const runPhoto = async (action: () => Promise<string | null>) => {
    try {
      const uri = await action();
      if (uri) setPhotoUri(uri); // null means the user cancelled
    } catch (e) {
      setError(reportError("medicine photo", e));
    }
  };

  const handlePhoto = () => {
    Alert.alert("Medicine photo", "Add a picture so the medicine is easy to recognise.", [
      { text: "Take photo", onPress: () => runPhoto(takePhoto) },
      { text: "Choose from gallery", onPress: () => runPhoto(pickFromGallery) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!user) return;

    const input: MedicineInput = {
      name: name.trim(),
      dosage: dosage.trim(),
      type,
      scheduleTime: toTimeString(time),
      startDate: toDateString(startDate),
      durationDays: duration,
      notes: notes.trim(),
      photoUri,
    };

    const problem = validateMedicine(input);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      logger.info("Saving medicine started");
      let id: number;
      if (editingId) {
        const old = await getMedicine(user.uid, editingId);
        if (old) await cancelReminders(old.notificationIds);
        await updateMedicine(user.uid, editingId, input);
        id = editingId;
      } else {
        id = await addMedicine(user.uid, input);
      }

      // The medicine is already saved. A reminder problem must not undo that,
      // so it is reported to the user instead of thrown.
      const saved = await getMedicine(user.uid, id);
      let warning: string | null = null;
      if (saved) {
        const result = await scheduleReminders(saved, { prompt: true });
        await setNotificationIds(id, result.ids);
        warning = result.warning;
      }
      logger.info("Saving medicine completed");

      if (warning) {
        Alert.alert("Saved, but no reminder set", warning, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        navigation.goBack();
      }
    } catch (e) {
      reportError("save medicine", e);
      setError("Could not save the medicine. Please try again.");
      setBusy(false);
    }
  };

  if (loading) return <LoadingView />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.photoBox} onPress={handlePhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="camera" size={34} color={colors.primary} />
              <Text style={styles.photoHint}>Add photo</Text>
            </View>
          )}
        </Pressable>
        {photoUri ? (
          <Pressable onPress={() => setPhotoUri(null)}>
            <Text style={styles.removePhoto}>Remove photo</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Medicine name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Paracetamol" editable={!busy} />

        <Text style={styles.label}>Dosage</Text>
        <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="e.g. 500 mg or 1 tablet" editable={!busy} />

        <Text style={styles.label}>Type</Text>
        <View style={styles.chips}>
          {MEDICINE_TYPES.map((t) => (
            <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>

        <DateTimeField label="Schedule time" mode="time" value={time} onChange={setTime} />
        <DateTimeField
          label="Start date"
          mode="date"
          value={startDate}
          onChange={setStartDate}
          minimumDate={editingId ? undefined : new Date()}
        />

        <Text style={styles.label}>How long?</Text>
        <View style={styles.chips}>
          {DURATIONS.map((d) => (
            <Chip key={d.value} label={d.label} selected={duration === d.value} onPress={() => setDuration(d.value)} />
          ))}
        </View>

        <Text style={styles.label}>Extra note (optional)</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Take after food"
          multiline
          editable={!busy}
        />

        <ErrorMessage message={error} />

        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={handleSave} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Save Medicine</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 60 },
  photoBox: {
    alignSelf: "center", width: 116, height: 116, borderRadius: radius.lg, overflow: "hidden",
    backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border,
  },
  photo: { width: "100%", height: "100%" },
  photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  photoHint: { color: colors.primaryDark, fontWeight: "600", marginTop: 4 },
  removePhoto: { textAlign: "center", color: colors.danger, marginTop: spacing.sm, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6, marginTop: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: 14, fontSize: 16, backgroundColor: colors.white,
  },
  notes: { minHeight: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  chipTextSelected: { color: colors.white },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: "center", marginTop: spacing.lg },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});