import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { formatDateLong, formatTime, toDateString, toTimeString } from "../utils/dateUtils";
import { colors, radius, spacing } from "../utils/theme";

interface Props {
  label?: string;
  mode: "date" | "time";
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

export default function DateTimeField({ label, mode, value, onChange, minimumDate }: Props) {
  const [showIos, setShowIos] = useState(false);

  const text =
    mode === "date" ? formatDateLong(toDateString(value)) : formatTime(toTimeString(value));

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode,
        minimumDate,
        is24Hour: false,
        onChange: (event, selected) => {
          if (event.type === "set" && selected) onChange(selected);
        },
      });
    } else {
      setShowIos((v) => !v);
    }
  };

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={open}>
        <Ionicons
          name={mode === "date" ? "calendar-outline" : "time-outline"}
          size={20}
          color={colors.primary}
        />
        <Text style={styles.text}>{text}</Text>
      </Pressable>
      {Platform.OS === "ios" && showIos ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display="spinner"
          minimumDate={minimumDate}
          onChange={(_, selected) => selected && onChange(selected)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6, marginTop: spacing.md },
  field: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: 14, backgroundColor: colors.background,
  },
  text: { marginLeft: spacing.sm, fontSize: 16, color: colors.text },
});