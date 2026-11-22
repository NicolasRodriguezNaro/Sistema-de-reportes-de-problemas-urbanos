import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch, ApiError } from "../api";
import { Text } from "../components/AppText";
import { AppButton, Brand, TextField } from "../components/ui";
import { useLanguage } from "../i18n";
import { fonts, radius, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";
import type { CaptchaResponse } from "../types";

type Paso = "solicitar" | "confirmar" | "listo";

export function RecoveryScreen() {
  const router = useRouter();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);
  const { t } = useLanguage();

  const [paso, setPaso] = useState<Paso>("solicitar");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [captchaTexto, setCaptchaTexto] = useState("");
  const [captchaCargando, setCaptchaCargando] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargarCaptcha = useCallback(async () => {
    setCaptchaCargando(true);
    setCaptchaTexto("");
    try {
      const data = await apiFetch<CaptchaResponse>("/api/auth/captcha");
      setCaptcha(data);
    } catch {
      setCaptcha(null);
      setError(t("No se pudo cargar el captcha."));
    } finally {
      setCaptchaCargando(false);
    }
  }, [t]);

  useEffect(() => {
    let activo = true;
    apiFetch<CaptchaResponse>("/api/auth/captcha")
      .then((data) => {
        if (!activo) return;
        setCaptcha(data);
        setCaptchaTexto("");
      })
      .catch(() => {
        if (!activo) return;
        setCaptcha(null);
        setError(t("No se pudo cargar el captcha."));
      })
      .finally(() => {
        if (activo) setCaptchaCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [t]);

  const solicitar = async () => {
    setError(null);
    if (!captcha || !captchaTexto.trim()) {
      setError(t("Completa el código de verificación."));
      return;
    }

    setEnviando(true);
    try {
      await apiFetch("/api/auth/recuperacion", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          captchaId: captcha.id,
          captchaRespuesta: captchaTexto.trim(),
        }),
      });
      setPaso("confirmar");
      setError(null);
    } catch {
      setError(t("No se pudo enviar el código. Intenta de nuevo."));
      await cargarCaptcha();
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async () => {
    setError(null);
    if (nuevaPassword.length < 8) {
      setError(t("La contraseña debe tener al menos 8 caracteres."));
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError(t("Las contraseñas no coinciden."));
      return;
    }

    setEnviando(true);
    try {
      await apiFetch("/api/auth/recuperacion/confirmar", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          codigo: codigo.trim(),
          nuevaPassword,
        }),
      });
      setPaso("listo");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? t("El código es inválido o expiró.")
          : t("No se pudo restablecer la contraseña. Intenta de nuevo.")
      );
    } finally {
      setEnviando(false);
    }
  };

  const volver = () => {
    if (paso === "confirmar") {
      setPaso("solicitar");
      setError(null);
      void cargarCaptcha();
      return;
    }
    if (paso === "listo") {
      router.replace("/login");
      return;
    }
    router.back();
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
              accessibilityLabel={t("Volver")}
              onPress={volver}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.brand} />
            </Pressable>
            <Brand />
            <View style={styles.topSpacer} />
          </View>

          <View style={styles.heading}>
            <Text style={styles.kicker}>
              {paso === "listo" ? t("Listo") : t("Recuperación de acceso")}
            </Text>
            <Text style={styles.title}>
              {paso === "solicitar"
                ? t("Recupera tu contraseña")
                : paso === "confirmar"
                  ? t("Crea una nueva contraseña")
                  : t("Contraseña actualizada")}
            </Text>
            <Text style={styles.subtitle}>
              {paso === "solicitar"
                ? t("Escribe tu correo y te enviaremos un código de 6 dígitos para crear una nueva contraseña.")
                : paso === "confirmar"
                  ? t("Enviamos un código a {email}. Vence en 10 minutos.", { email })
                  : t("Ya puedes iniciar sesión con tu nueva contraseña.")}
            </Text>
          </View>

          <View style={styles.card}>
            {paso === "solicitar" && (
              <View style={styles.fields}>
                <TextField
                  label="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@correo.com"
                  keyboardType="email-address"
                />
                <View style={styles.captchaBox}>
                  {captcha ? (
                    <Image source={{ uri: captcha.imagen }} style={styles.captchaImage} />
                  ) : (
                    <View style={[styles.captchaImage, styles.captchaPlaceholder]}>
                      {captchaCargando ? (
                        <ActivityIndicator color={colors.brand} />
                      ) : (
                        <Text style={styles.captchaPlaceholderText}>Sin captcha</Text>
                      )}
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("Actualizar captcha")}
                    onPress={() => void cargarCaptcha()}
                    disabled={captchaCargando || enviando}
                    style={styles.captchaRefresh}
                  >
                    <Ionicons name="refresh-outline" size={16} color={colors.brand} />
                    <Text style={styles.captchaRefreshText}>{t("Actualizar")}</Text>
                  </Pressable>
                </View>
                <TextField
                  label="Código de verificación"
                  value={captchaTexto}
                  onChangeText={setCaptchaTexto}
                  placeholder="Escribe el código de la imagen"
                  autoCapitalize="characters"
                />
              </View>
            )}

            {paso === "confirmar" && (
              <View style={styles.fields}>
                <TextField
                  label="Código de recuperación"
                  value={codigo}
                  onChangeText={(value) => setCodigo(value.replace(/\D/g, ""))}
                  placeholder="Escribe el código de 6 dígitos"
                  keyboardType="number-pad"
                />
                <TextField
                  label="Nueva contraseña"
                  value={nuevaPassword}
                  onChangeText={setNuevaPassword}
                  placeholder="Mínimo 8 caracteres"
                  secure
                />
                <TextField
                  label="Confirmar contraseña"
                  value={confirmarPassword}
                  onChangeText={setConfirmarPassword}
                  placeholder="Repite la nueva contraseña"
                  secure
                />
              </View>
            )}

            {paso === "listo" && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={54} color={colors.success} />
                <Text style={styles.successText}>{t("Tu contraseña se cambió correctamente.")}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {paso === "solicitar" && (
              <AppButton
                title={enviando ? "Enviando..." : "Enviar código"}
                icon="mail-outline"
                loading={enviando}
                onPress={solicitar}
              />
            )}
            {paso === "confirmar" && (
              <View style={styles.actions}>
                <AppButton
                  title={enviando ? "Guardando..." : "Restablecer contraseña"}
                  icon="checkmark"
                  loading={enviando}
                  onPress={confirmar}
                />
                <AppButton
                  title="Usar otro correo"
                  variant="secondary"
                  disabled={enviando}
                  onPress={() => {
                    setPaso("solicitar");
                    setError(null);
                    void cargarCaptcha();
                  }}
                />
              </View>
            )}
            {paso === "listo" && (
              <AppButton
                title="Volver al inicio de sesión"
                icon="log-in-outline"
                onPress={() => router.replace("/login")}
              />
            )}

            {paso === "solicitar" && (
              <Pressable onPress={() => router.replace("/login")} style={styles.loginLink}>
                <Text style={styles.loginText}>
                  {t("¿Recordaste tu contraseña?")}{" "}
                  <Text style={styles.loginStrong}>{t("Iniciar sesión")}</Text>
                </Text>
              </Pressable>
            )}
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
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -1,
      marginTop: 6,
    },
    subtitle: {
      color: colors.muted,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 21,
      marginTop: 10,
      maxWidth: 340,
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
    captchaBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    captchaImage: {
      width: 168,
      height: 56,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    captchaPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    captchaPlaceholderText: {
      color: colors.soft,
      fontFamily: fonts.medium,
      fontSize: 10,
    },
    captchaRefresh: {
      flex: 1,
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    captchaRefreshText: {
      color: colors.brand,
      fontFamily: fonts.bold,
      fontSize: 10,
    },
    actions: {
      gap: spacing.sm,
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
    successBox: {
      alignItems: "center",
      paddingVertical: spacing.xl,
    },
    successText: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.md,
      textAlign: "center",
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
  });
}
