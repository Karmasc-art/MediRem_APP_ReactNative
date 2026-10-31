import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "MedicineDetails">;

export default function MedicineDetailsScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Details for medicine #{route.params.medicineId} (Stage 3)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  text: { color: colors.textMuted },
});