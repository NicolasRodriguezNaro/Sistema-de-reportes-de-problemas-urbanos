import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiFetch, subirImagen } from "../api";
import { AppButton, StatusBadge, TextField } from "../components/ui";
import { colors, fonts, radius, shadows, spacing } from "../theme";
import type { ReporteDetalle } from "../types";

type Paso = 1 | 2 | 3;

interface Ubicacion {
  latitude: number;
  longitude: number;
}

export function NewReportScreen() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(1);
  const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporteCreado, setReporteCreado] = useState<ReporteDetalle | null>(null);
  const reporteCreadoRef = useRef<ReporteDetalle | null>(null);

  const reiniciar = useCallback(() => {
    reporteCreadoRef.current = null;
    setPaso(1);
    setFoto(null);
    setUbicacion(null);
    setDescripcion("");
    setError(null);
    setReporteCreado(null);
  }, []);

  // Las pestañas conservan el estado de la pantalla al cambiar de sección.
  // Si ya se envió un reporte, se reinicia al perder el foco: al abrir el
  // detalle o al cambiar de pestaña. Así no se ve el formulario de foto
  // durante la transición y, al volver, ya está listo para otro reporte.
  // Si el usuario solo cambió de pestaña durante el borrador, el estado se conserva.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (reporteCreadoRef.current) {
          reiniciar();
        }
      };
    }, [reiniciar])
  );

  const volver = () => {
    if (paso > 1) {
      setPaso((pasoActual) => (pasoActual - 1) as Paso);
      setError(null);
      return;
    }
    router.replace("/");
  };

  const pedirFoto = async (origen: "camara" | "galeria") => {
    setError(null);
    try {
      const permiso =
        origen === "camara"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso necesario",
          "Activa el acceso a la cámara o a tus fotos para adjuntar la evidencia.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir ajustes", onPress: () => void Linking.openSettings() },
          ]
        );
        return;
      }

      const resultado =
        origen === "camara"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
              allowsEditing: false,
            });

      if (!resultado.canceled && resultado.assets[0]) {
        setFoto(resultado.assets[0]);
      }
    } catch {
      setError("No se pudo abrir la cámara o la galería.");
    }
  };

  const obtenerUbicacion = async () => {
    setError(null);
    setCargandoUbicacion(true);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso necesario",
          "Necesitamos tu ubicación para registrar el punto de la incidencia.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir ajustes", onPress: () => void Linking.openSettings() },
          ]
        );
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUbicacion({
        latitude: posicion.coords.latitude,
        longitude: posicion.coords.longitude,
      });
    } catch {
      setError("No se pudo obtener tu ubicación. Intenta de nuevo.");
    } finally {
      setCargandoUbicacion(false);
    }
  };

  const enviar = async () => {
    if (!foto || !ubicacion) return;
    setEnviando(true);
    setError(null);
    try {
      const archivo = await subirImagen(
        foto.uri,
        foto.fileName ?? `evidencia-${Date.now()}.jpg`,
        foto.mimeType ?? "image/jpeg",
        foto.file
      );

      const reporte = await apiFetch<ReporteDetalle>("/api/reportes", {
        method: "POST",
        body: JSON.stringify({
          descripcion: descripcion.trim() || undefined,
          latitud: ubicacion.latitude,
          longitud: ubicacion.longitude,
          claveImagenHd: archivo.clave,
          claveImagenThumb: archivo.claveThumb,
        }),
      });

      reporteCreadoRef.current = reporte;
      setReporteCreado(reporte);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el reporte.");
    } finally {
      setEnviando(false);
    }
  };

  if (reporteCreado) {
    return (
      <SuccessView
        reporte={reporteCreado}
        onVerReporte={() => router.push(`/reporte/${reporteCreado.id}`)}
        onInicio={() => {
          reiniciar();
          router.replace("/");
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.topbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={volver}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={colors.brand} />
          </Pressable>
          <View style={styles.topbarCopy}>
            <Text style={styles.kicker}>NUEVO REPORTE</Text>
            <Text style={styles.title}>{paso === 1 ? "Adjunta una foto" : paso === 2 ? "Confirma el lugar" : "Revisa y envía"}</Text>
          </View>
          <View style={styles.stepCounter}><Text style={styles.stepCounterText}>{paso}/3</Text></View>
        </View>

        <StepIndicator paso={paso} />

        {paso === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.helper}>
              Una imagen clara ayuda a clasificar mejor la incidencia. Puedes tomarla en el momento o elegirla de tu galería.
            </Text>

            {foto ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: foto.uri }} style={styles.photoPreview} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFoto(null)}
                  style={styles.removePhoto}
                >
                  <Ionicons name="close" size={17} color={colors.white} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void pedirFoto("galeria")}
                  style={styles.changePhoto}
                >
                  <Ionicons name="images-outline" size={15} color={colors.brand} />
                  <Text style={styles.changePhotoText}>Cambiar foto</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIcon}>
                  <Ionicons name="camera-outline" size={29} color={colors.brand} />
                </View>
                <Text style={styles.photoTitle}>Tu foto es la evidencia</Text>
                <Text style={styles.photoText}>Procura que se vea el problema y el contexto del lugar.</Text>
                <View style={styles.photoActions}>
                  <AppButton title="Tomar foto" icon="camera-outline" onPress={() => void pedirFoto("camara")} />
                  <AppButton
                    title="Elegir de galería"
                    variant="secondary"
                    icon="images-outline"
                    onPress={() => void pedirFoto("galeria")}
                  />
                </View>
              </View>
            )}

            {error && <ErrorMessage text={error} />}
            <AppButton
              title="Continuar"
              icon="arrow-forward"
              disabled={!foto}
              onPress={() => setPaso(2)}
            />
          </View>
        )}

        {paso === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.helper}>
              Necesitamos la ubicación exacta para enviar el caso a la entidad responsable.
            </Text>

            <LinearGradient colors={[colors.brandDeep, colors.brand]} style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons name="navigate-outline" size={26} color={colors.mint} />
              </View>
              <Text style={styles.locationTitle}>
                {ubicacion ? "Ubicación lista" : "Aún no tenemos tu ubicación"}
              </Text>
              <Text style={styles.locationText}>
                {ubicacion
                  ? `${ubicacion.latitude.toFixed(5)}, ${ubicacion.longitude.toFixed(5)}`
                  : "Activa el GPS del dispositivo para registrar el punto."}
              </Text>
              {ubicacion && (
                <View style={styles.locationBadge}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.mint} />
                  <Text style={styles.locationBadgeText}>Punto capturado</Text>
                </View>
              )}
            </LinearGradient>

            <AppButton
              title={ubicacion ? "Actualizar ubicación" : "Usar mi ubicación"}
              variant="secondary"
              icon="locate-outline"
              loading={cargandoUbicacion}
              onPress={() => void obtenerUbicacion()}
            />

            {error && <ErrorMessage text={error} />}
            <AppButton
              title="Continuar"
              icon="arrow-forward"
              disabled={!ubicacion}
              onPress={() => setPaso(3)}
            />
            <Text style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.soft} /> Tu ubicación solo se usa para ubicar el reporte.
            </Text>
          </View>
        )}

        {paso === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.reviewCard}>
              {foto && <Image source={{ uri: foto.uri }} style={styles.reviewPhoto} />}
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewLabel}>UBICACIÓN</Text>
                <Text style={styles.reviewValue}>
                  {ubicacion ? `${ubicacion.latitude.toFixed(4)}, ${ubicacion.longitude.toFixed(4)}` : "Sin ubicación"}
                </Text>
                <Text style={[styles.reviewLabel, { marginTop: 10 }]}>CLASIFICACIÓN</Text>
                <Text style={styles.reviewValue}>La IA completará categoría y severidad</Text>
              </View>
            </View>

            <TextField
              label="Descripción (opcional)"
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Cuéntanos qué está pasando..."
              multiline
              autoCapitalize="sentences"
            />

            <View style={styles.aiNote}>
              <Ionicons name="sparkles-outline" size={18} color={colors.brand} />
              <Text style={styles.aiNoteText}>
                El asistente de IA analizará la imagen para sugerir la categoría y la severidad del reporte.
              </Text>
            </View>

            {error && <ErrorMessage text={error} />}

            <AppButton
              title="Enviar reporte"
              icon="send-outline"
              loading={enviando}
              onPress={() => void enviar()}
            />
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({ paso }: { paso: Paso }) {
  return (
    <View style={styles.indicator}>
      {[1, 2, 3].map((numero) => (
        <View key={numero} style={styles.indicatorItem}>
          <View style={[styles.indicatorCircle, numero <= paso && styles.indicatorCircleActive]}>
            {numero < paso ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : (
              <Text style={[styles.indicatorNumber, numero <= paso && styles.indicatorNumberActive]}>
                {numero}
              </Text>
            )}
          </View>
          {numero < 3 && <View style={[styles.indicatorLine, numero < paso && styles.indicatorLineActive]} />}
        </View>
      ))}
    </View>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

function SuccessView({
  reporte,
  onVerReporte,
  onInicio,
}: {
  reporte: ReporteDetalle;
  onVerReporte: () => void;
  onInicio: () => void;
}) {
  return (
    <SafeAreaView style={styles.successSafe} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.successContent}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={43} color={colors.white} />
        </View>
        <Text style={styles.successKicker}>REPORTE ENVIADO</Text>
        <Text style={styles.successTitle}>Gracias por cuidar tu ciudad.</Text>
        <Text style={styles.successText}>
          Tu reporte fue recibido y será revisado por el equipo municipal.
        </Text>

        <View style={styles.successCard}>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Número de reporte</Text>
            <Text style={styles.successValue}>#{reporte.id}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Estado inicial</Text>
            <StatusBadge estado={reporte.estado} />
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Entidad asignada</Text>
            <Text style={styles.successValue}>
              {reporte.entidadNombre ??
                (reporte.entidadAsignadaId ? `Entidad ${reporte.entidadAsignadaId}` : "Por asignar")}
            </Text>
          </View>
        </View>

        <View style={styles.successActions}>
          <AppButton title="Ver mi reporte" icon="document-text-outline" onPress={onVerReporte} />
          <AppButton title="Volver al inicio" variant="secondary" icon="home-outline" onPress={onInicio} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  topbarCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.3,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  stepCounter: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.mintSoft,
  },
  stepCounterText: {
    color: colors.brand,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  indicatorItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicatorCircleActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  indicatorNumber: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  indicatorNumberActive: {
    color: colors.white,
  },
  indicatorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 5,
    backgroundColor: colors.border,
  },
  indicatorLineActive: {
    backgroundColor: colors.brand,
  },
  stepContent: {
    gap: spacing.lg,
  },
  helper: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  photoPlaceholder: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
  },
  photoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  photoTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 17,
    marginTop: spacing.lg,
  },
  photoText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 280,
  },
  photoActions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  photoPreviewWrap: {
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: 300,
    borderRadius: radius.xl,
  },
  removePhoto: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,46,56,0.72)",
  },
  changePhoto: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  changePhotoText: {
    color: colors.brand,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  locationCard: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.xl,
    minHeight: 240,
    justifyContent: "center",
  },
  locationIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,213,200,0.12)",
  },
  locationTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 18,
    marginTop: spacing.lg,
  },
  locationText: {
    color: "rgba(230,250,247,0.68)",
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.lg,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(139,213,200,0.12)",
  },
  locationBadgeText: {
    color: colors.mint,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  privacyNote: {
    color: colors.soft,
    fontFamily: fonts.regular,
    fontSize: 9,
    textAlign: "center",
  },
  reviewCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewPhoto: {
    width: 105,
    height: 112,
    borderRadius: radius.md,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewLabel: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  reviewValue: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  aiNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  aiNoteText: {
    flex: 1,
    color: colors.brand,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  successSafe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  successContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: spacing.xl,
    paddingTop: 60,
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    ...shadows.card,
  },
  successKicker: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: spacing.lg,
  },
  successTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  successText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 300,
  },
  successCard: {
    width: "100%",
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  successActions: {
    width: "100%",
    gap: spacing.sm,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  successLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  successValue: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
});
