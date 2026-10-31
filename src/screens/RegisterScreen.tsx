import React, { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { register } from "../services/authService";
import { useAuth } from "../services/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import { colors, radius, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await register(name, email, password);
      refreshUser(); // pick up the display name that was just saved
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up MediRem in a minute</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" editable={!busy} />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com"
            autoCapitalize="none" keyboardType="email-address" editable={!busy}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input} value={password} onChangeText={setPassword}
            placeholder="At least 6 characters" secureTextEntry editable={!busy}
          />
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input} value={confirm} onChangeText={setConfirm}
            placeholder="Repeat password" secureTextEntry editable={!busy}
          />
          <ErrorMessage message={error} />

          <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={handleRegister} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign up</Text>}
          </Pressable>

          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  title: { fontSize: 30, fontWeight: "800", color: colors.primaryDark, textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  form: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: 14, fontSize: 16, backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 16, alignItems: "center", marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  link: { textAlign: "center", color: colors.textMuted, marginTop: spacing.lg },
  linkBold: { color: colors.primary, fontWeight: "700" },
});