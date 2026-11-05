import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../api";
import { useAuth } from "../auth";
import { AppButton, Brand, TextField } from "../components/ui";
import { colors, fonts, radius, spacing } from "../theme";

export function LoginScreen() {
  const router = useRouter();
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
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
          <LinearGradient
            colors={[colors.brandDeep, colors.brand, "#0b3440"]}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <Brand light />
              <View style={styles.heroIcon}>
                <Ionicons name="location-outline" size={19} color={colors.mint} />
              </View>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>FLORENCIA, CAQUETÁ</Text>
              <Text style={styles.heroTitle}>Tu ciudad, más cerca de ti.</Text>
              <Text style={styles.heroText}>
                Reporta incidencias, adjunta una foto y sigue el estado de tu caso.
              </Text>
            </View>
            <View style={styles.heroLine}>
              <View style={styles.heroLineDot} />
              <Text style={styles.heroLineText}>Servicio ciudadano</Text>
            </View>
          </LinearGradient>

          <View style={styles.formCard}>
            <View style={styles.formHeading}>
              <Text style={styles.formKicker}>BIENVENIDO</Text>
              <Text style={styles.formTitle}>Inicia sesión</Text>
              <Text style={styles.formSubtitle}>
                Usa el correo y la contraseña de tu cuenta ciudadana.
              </Text>
            </View>

            <View style={styles.fields}>
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
                placeholder="Tu contraseña"
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
              title="Entrar a mi cuenta"
              icon="arrow-forward"
              loading={enviando}
              onPress={enviar}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/register")}
              style={styles.registerLink}
            >
              <Text style={styles.registerText}>
                ¿No tienes cuenta? <Text style={styles.registerStrong}>Regístrate</Text>
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Reporte Urbano · Plataforma de gestión de incidencias urbanas
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    minHeight: 310,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,213,200,0.12)",
  },
  heroCopy: {
    marginTop: 40,
    maxWidth: 310,
  },
  heroKicker: {
    color: colors.mint,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: -1.2,
    marginTop: 8,
  },
  heroText: {
    color: "rgba(230,250,247,0.72)",
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
  },
  heroLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 25,
  },
  heroLineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.mint,
  },
  heroLineText: {
    color: "rgba(230,250,247,0.65)",
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  formCard: {
    marginHorizontal: spacing.md,
    marginTop: -18,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    shadowColor: colors.brandDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  formHeading: {
    marginBottom: spacing.lg,
  },
  formKicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  formTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 28,
    letterSpacing: -0.6,
    marginTop: 5,
  },
  formSubtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
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
  registerLink: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  registerText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  registerStrong: {
    color: colors.brand,
    fontFamily: fonts.bold,
  },
  footer: {
    textAlign: "center",
    color: colors.soft,
    fontFamily: fonts.regular,
    fontSize: 9,
    marginTop: spacing.xl,
  },
});
