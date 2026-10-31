import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../services/AuthContext";
import { colors, radius, shadow, spacing } from "../utils/theme";

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={44} color={colors.white} />
      </View>
      {user?.displayName ? <Text style={styles.name}>{user.displayName}</Text> : null}
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.card}>
        <Pressable style={styles.row} onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          <Text style={styles.rowText}>Notification settings</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.row} onPress={signOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={[styles.rowText, { color: colors.danger }]}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, alignItems: "center", padding: spacing.md },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center", marginTop: spacing.lg,
  },
  email: { fontSize: 17, fontWeight: "600", color: colors.text, marginVertical: spacing.md },
  card: { width: "100%", backgroundColor: colors.card, borderRadius: radius.md, ...shadow },
  row: {
    flexDirection: "row", alignItems: "center", padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  name: { fontSize: 22, fontWeight: "800", color: colors.primaryDark, marginTop: spacing.md },
  rowText: { flex: 1, marginLeft: spacing.md, fontSize: 16, color: colors.text },
});