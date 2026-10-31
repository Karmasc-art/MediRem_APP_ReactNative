import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { login, resetPassword } from "../services/authService";
import ErrorMessage from "../components/ErrorMessage";
import { colors, radius, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      // Navigation happens automatically when Firebase reports the user is signed in.
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then tap Forgot password.");
      return;
    }
    setError(null);
    try {
      await resetPassword(email);
      Alert.alert("Check your email", "If an account exists for that address, a reset link has been sent.");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Ionicons name="medkit" size={48} color={colors.white} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to see today's medicines</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input} placeholder="you@example.com" autoCapitalize="none"
            keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]} placeholder="Your password"
              secureTextEntry={!showPassword} value={password} onChangeText={setPassword} editable={!busy}
            />
            <Pressable style={styles.eye} onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Pressable onPress={handleForgot}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          <ErrorMessage message={error} />

          <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={handleLogin} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Login</Text>}
          </Pressable>

          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  logo: {
    alignSelf: "center", width: 96, height: 96, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "800", color: colors.primaryDark, textAlign: "center", marginTop: spacing.md },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginBottom: spacing.xl },
  form: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: 14, fontSize: 16, backgroundColor: colors.background,
  },
  passwordRow: { justifyContent: "center" },
  passwordInput: { paddingRight: 48 },
  eye: { position: "absolute", right: 14 },
  forgot: { color: colors.primary, fontWeight: "600", textAlign: "right", marginTop: spacing.sm },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: 16, alignItems: "center", marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  link: { textAlign: "center", color: colors.textMuted, marginTop: spacing.lg },
  linkBold: { color: colors.primary, fontWeight: "700" },
});