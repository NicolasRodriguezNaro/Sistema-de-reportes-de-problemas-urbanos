import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiFetch } from "../api";
import { EmptyView, ReportCard, Screen } from "../components/ui";
import { colors, fonts, spacing } from "../theme";
import type { PaginaResponse, ReporteResumen } from "../types";

export function MyReportsScreen() {
  const router = useRouter();
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (refrescar = false) => {
    if (refrescar) setRefrescando(true);
    else setCargando(true);
    setError(null);
    try {
      const data = await apiFetch<PaginaResponse<ReporteResumen>>("/api/reportes/mios?page=0&size=50");
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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => void cargar(true)}
            tintColor={colors.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.kicker}>TU HISTORIAL</Text>
          <Text style={styles.title}>Mis reportes</Text>
          <Text style={styles.subtitle}>
            {reportes.length > 0
              ? `${reportes.length} ${reportes.length === 1 ? "reporte" : "reportes"} en tu cuenta`
              : "Aquí verás el estado de las incidencias que reportes."}
          </Text>
        </View>

        {cargando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.loadingText}>Cargando tus reportes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : reportes.length === 0 ? (
          <EmptyView
            title="Aún no tienes reportes"
            description="Cuando reportes una incidencia, aparecerá aquí con su estado y seguimiento."
            icon="document-text-outline"
          />
        ) : (
          <View style={styles.list}>
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

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
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
    fontSize: 29,
    letterSpacing: -0.8,
    marginTop: 3,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  list: {
    gap: spacing.sm,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
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
    borderRadius: 16,
    backgroundColor: "#fffaf5",
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
});
