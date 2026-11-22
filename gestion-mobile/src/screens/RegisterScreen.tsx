import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../api";
import { useAuth } from "../auth";
import { Text } from "../components/AppText";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { AppButton, Brand, TextField } from "../components/ui";
import { useLanguage } from "../i18n";
import { fonts, radius, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";

export function RegisterScreen() {
  const router = useRouter();
  const { registrar } = useAuth();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);
  const { t } = useLanguage();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await registrar(nombre.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.brand} />
            </Pressable>
            <Brand />
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.heading}>
            <Text style={styles.kicker}>NUEVA CUENTA</Text>
            <Text style={styles.title}>Haz oír tu ciudad.</Text>
            <Text style={styles.subtitle}>
              Crea tu cuenta para reportar incidencias y consultar el estado de tus casos.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fields}>
              <TextField
                label="Nombre completo"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                autoCapitalize="words"
              />
              <TextField
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                keyboardType="email-address"
              />
              <TextField
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                secure
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <AppButton
              title="Crear mi cuenta"
              icon="arrow-forward"
              loading={enviando}
              onPress={enviar}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                {t("¿Ya tienes cuenta?")} <Text style={styles.loginStrong}>Inicia sesión</Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.languageRow}>
            <LanguageSwitcher />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  topSpacer: {
    width: 42,
  },
  heading: {
    marginTop: 42,
  },
  kicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    marginTop: 6,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 330,
  },
  card: {
    marginTop: spacing.xxl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fields: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
  loginLink: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  loginText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  loginStrong: {
    color: colors.brand,
    fontFamily: fonts.bold,
  },
  languageRow: {
    alignItems: "flex-end",
    marginTop: spacing.md,
  },
  });
}
