import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiFetch } from "../api";
import { useAuth } from "../auth";
import { EmptyView, ReportCard, Screen } from "../components/ui";
import { fonts, radius, shadows, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";
import type { PaginaResponse, ReporteResumen } from "../types";

export function HomeScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (refrescar = false) => {
    if (refrescar) setRefrescando(true);
    else setCargando(true);
    setError(null);
    try {
      const data = await apiFetch<PaginaResponse<ReporteResumen>>("/api/reportes/mios?page=0&size=3");
      setReportes(data.contenido);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus reportes.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  const nombre = usuario?.nombre.split(" ")[0] ?? "ciudadano";

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => void cargar(true)}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.topbar}>
          <View>
            <Text style={styles.kicker}>REPORTE URBANO</Text>
            <Text style={styles.greeting}>Hola, {nombre}</Text>
            <View style={styles.locationLine}>
              <Ionicons name="location-outline" size={13} color={colors.brand} />
              <Text style={styles.locationText}>Florencia, Caquetá</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir al perfil"
            onPress={() => router.push("/perfil")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(usuario?.nombre ?? "U")
                .split(" ")
                .slice(0, 2)
                .map((parte: string) => parte.charAt(0))
                .join("")
                .toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <LinearGradient
          colors={[colors.brandDeep, colors.brand, colors.brandMid]}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="camera-outline" size={25} color={colors.brandDeep} />
          </View>
          <Text style={styles.heroTitle}>Una foto puede mejorar tu ciudad.</Text>
          <Text style={styles.heroText}>
            Cuéntanos qué está pasando. La IA te ayuda a clasificar la incidencia.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/reportar")}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.brandDeep} />
            <Text style={styles.heroButtonText}>Reportar una incidencia</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.brandDeep} />
          </Pressable>
          <View style={styles.steps}>
            <View style={styles.step}><Text style={styles.stepNumber}>1</Text><Text style={styles.stepText}>Foto</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.step}><Text style={styles.stepNumber}>2</Text><Text style={styles.stepText}>Ubicación</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.step}><Text style={styles.stepNumber}>3</Text><Text style={styles.stepText}>Envío</Text></View>
          </View>
        </LinearGradient>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/mis-reportes")}
          style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
        >
          <View style={styles.quickIcon}>
            <Ionicons name="document-text-outline" size={22} color={colors.brand} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickTitle}>Mis reportes</Text>
            <Text style={styles.quickText}>Sigue el estado de tus casos</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.soft} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos reportes</Text>
          <Pressable onPress={() => router.push("/mis-reportes")}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </Pressable>
        </View>

        {cargando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>Cargando tus reportes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>No pudimos cargar tus reportes</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void cargar()}><Text style={styles.retry}>Reintentar</Text></Pressable>
            </View>
          </View>
        ) : reportes.length === 0 ? (
          <EmptyView
            title="Tu ciudad está esperando tu primer reporte"
            description="Si ves un hueco, una fuga o una luminaria apagada, cuéntanos con una foto."
            icon="leaf-outline"
          />
        ) : (
          <View style={styles.reportList}>
            {reportes.map((reporte) => (
              <ReportCard
                key={reporte.id}
                reporte={reporte}
                onPress={() => router.push(`/reporte/${reporte.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.3,
  },
  greeting: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    letterSpacing: -0.8,
    marginTop: 3,
  },
  locationLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mint,
  },
  avatarText: {
    color: colors.brandDeep,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mint,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.7,
    marginTop: spacing.lg,
    maxWidth: 310,
  },
  heroText: {
    color: "rgba(230,250,247,0.7)",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 310,
  },
  heroButton: {
    minHeight: 50,
    marginTop: spacing.xl,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.mint,
  },
  heroButtonText: {
    flex: 1,
    color: colors.brandDeep,
    fontFamily: fonts.bold,
    fontSize: 13,
    textAlign: "center",
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  stepNumber: {
    width: 17,
    height: 17,
    borderRadius: 9,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 17,
    color: colors.brandDeep,
    backgroundColor: "rgba(139,213,200,0.3)",
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  stepText: {
    color: "rgba(230,250,247,0.68)",
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.17)",
    marginHorizontal: 7,
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  quickCopy: {
    flex: 1,
  },
  quickTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  quickText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  sectionLink: {
    color: colors.brand,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  reportList: {
    gap: spacing.sm,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  errorBox: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  errorText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  retry: {
    color: colors.brand,
    fontFamily: fonts.bold,
    fontSize: 10,
    marginTop: 7,
  },
  pressed: {
    opacity: 0.85,
  },
  });
}
