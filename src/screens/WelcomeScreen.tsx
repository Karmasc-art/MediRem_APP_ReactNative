import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { colors, radius, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

function Feature({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={20} color={colors.white} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <View style={styles.logo}>
          <Ionicons name="medkit" size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>MediRem</Text>
        <Text style={styles.tagline}>Your remedy reminder</Text>

        <View style={styles.features}>
          <Feature icon="alarm-outline" text="Timely medicine reminders" />
          <Feature icon="checkmark-done-outline" text="Track taken and missed doses" />
          <Feature icon="calendar-outline" text="Review your full history" />
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable style={styles.button} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary, padding: spacing.lg, justifyContent: "space-between" },
  top: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 130, height: 130, borderRadius: 38, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 40, fontWeight: "800", color: colors.white, marginTop: spacing.lg },
  tagline: { fontSize: 16, color: "#C8E6C9", marginTop: 4 },
  features: { marginTop: spacing.xl, alignSelf: "stretch", paddingHorizontal: spacing.md },
  feature: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  featureText: { color: colors.white, fontSize: 16, marginLeft: spacing.sm + 4 },
  bottom: { paddingBottom: spacing.md },
  button: { backgroundColor: colors.white, borderRadius: radius.md, padding: 17, alignItems: "center" },
  buttonText: { color: colors.primaryDark, fontSize: 18, fontWeight: "800" },
  link: { textAlign: "center", color: "#C8E6C9", marginTop: spacing.md, fontSize: 15 },
  linkBold: { color: colors.white, fontWeight: "700" },
});