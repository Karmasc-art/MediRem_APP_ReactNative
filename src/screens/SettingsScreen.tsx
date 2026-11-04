import React, { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../services/AuthContext";
import {
  PermissionState, ReminderSettings, getPermissionState, loadSettings,
  rescheduleAll, saveSettings, sendTestNotification,
} from "../services/notificationService";
import { reportError } from "../utils/errorHandler";
import { colors, radius, shadow, spacing } from "../utils/theme";

function SwitchRow({ icon, label, hint, value, onValueChange }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; hint: string;
  value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>({ enabled: true, sound: true, vibration: true });
  const [permission, setPermission] = useState<PermissionState>("undetermined");

  useFocusEffect(
    useCallback(() => {
      loadSettings().then(setSettings).catch((e) => reportError("load settings", e));
      getPermissionState().then(setPermission).catch((e) => reportError("permission state", e));
    }, [])
  );

  const update = async (patch: Partial<ReminderSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await saveSettings(next);
      if (user) await rescheduleAll(user.uid); // apply to existing medicines
    } catch (e) {
      reportError("update settings", e);
      Alert.alert("Error", "Could not save your settings.");
    }
  };

  const handleTest = async () => {
    try {
      const sent = await sendTestNotification();
      setPermission(await getPermissionState());
      Alert.alert(
        sent ? "Test reminder sent" : "Notifications not allowed",
        sent
          ? "You should get a reminder in about 5 seconds. Try locking your phone to check it."
          : "Allow notifications for MediRem in your phone settings."
      );
    } catch (e) {
      reportError("test notification", e);
      Alert.alert("Error", "Could not send the test reminder.");
    }
  };

  const permissionText =
    permission === "granted" ? "Allowed" : permission === "denied" ? "Blocked in phone settings" : "Not asked yet";

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <SwitchRow
          icon="notifications-outline" label="Medicine reminders" hint="Turn all reminders on or off"
          value={settings.enabled} onValueChange={(v) => update({ enabled: v })}
        />
        <SwitchRow
          icon="volume-high-outline" label="Sound" hint="Play a sound with each reminder"
          value={settings.sound} onValueChange={(v) => update({ sound: v })}
        />
        <SwitchRow
          icon="phone-portrait-outline" label="Vibration" hint="Vibrate when a reminder arrives"
          value={settings.vibration} onValueChange={(v) => update({ vibration: v })}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Notification permission</Text>
            <Text style={styles.rowHint}>{permissionText}</Text>
          </View>
        </View>
        {permission === "denied" ? (
          <Pressable style={styles.linkButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.linkText}>Open phone settings</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.button} onPress={handleTest}>
        <Text style={styles.buttonText}>Send a test reminder</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.md, marginBottom: spacing.md, ...shadow },
  row: { flexDirection: "row", alignItems: "center", padding: spacing.md },
  rowText: { flex: 1, marginHorizontal: spacing.md },
  rowLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  rowHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  linkButton: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  linkText: { color: colors.primary, fontWeight: "700" },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: "center" },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});