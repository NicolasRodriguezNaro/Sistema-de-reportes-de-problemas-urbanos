import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiFetch } from "../api";
import { EmptyView, ReportCard, Screen } from "../components/ui";
import { fonts, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";
import type { PaginaResponse, ReporteResumen } from "../types";

const TAMANO_PAGINA = 12;

export function MyReportsScreen() {
  const router = useRouter();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargandoRef = useRef(false);
  const paginaSolicitadaRef = useRef(0);

  const cargar = useCallback(async (numeroPagina = 0, refrescar = false) => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    paginaSolicitadaRef.current = numeroPagina;

    if (refrescar) setRefrescando(true);
    else if (numeroPagina === 0) setCargando(true);
    else setCargandoMas(true);

    setError(null);
    try {
      const data = await apiFetch<PaginaResponse<ReporteResumen>>(
        `/api/reportes/mios?page=${numeroPagina}&size=${TAMANO_PAGINA}`
      );
      setTotal(data.total);
      setPagina(data.pagina);
      setHayMas(data.pagina + 1 < data.totalPaginas);
      setReportes((actuales) =>
        numeroPagina === 0 ? data.contenido : [...actuales, ...data.contenido]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus reportes.");
    } finally {
      cargandoRef.current = false;
      setCargando(false);
      setCargandoMas(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar(0);
    }, [cargar])
  );

  const cargarMas = () => {
    if (!hayMas || cargandoRef.current) return;
    void cargar(pagina + 1);
  };

  const cargarError = () => {
    void cargar(paginaSolicitadaRef.current);
  };

  const subtitulo =
    total > 0
      ? `${total} ${total === 1 ? "reporte" : "reportes"} en tu cuenta`
      : "Aquí verás el estado de las incidencias que reportes.";

  return (
    <Screen>
      <FlatList
        data={reportes}
        keyExtractor={(reporte) => String(reporte.id)}
        renderItem={({ item }) => (
          <ReportCard
            reporte={item}
            onPress={() => router.push(`/reporte/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => void cargar(0, true)}
            tintColor={colors.brand}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.kicker}>TU HISTORIAL</Text>
            <Text style={styles.title}>Mis reportes</Text>
            <Text style={styles.subtitle}>{subtitulo}</Text>
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.loadingText}>Cargando tus reportes...</Text>
            </View>
          ) : error ? (
            <ListError mensaje={error} onRetry={cargarError} />
          ) : (
            <EmptyView
              title="Aún no tienes reportes"
              description="Cuando reportes una incidencia, aparecerá aquí con su estado y seguimiento."
              icon="document-text-outline"
            />
          )
        }
        ListFooterComponent={
          cargandoMas ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.loadingText}>Cargando más reportes...</Text>
            </View>
          ) : error && reportes.length > 0 ? (
            <ListError mensaje={error} onRetry={cargarError} />
          ) : undefined
        }
        onEndReached={cargarMas}
        onEndReachedThreshold={0.4}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function Separador() {
  const styles = useThemedStyles(crearEstilos);

  return <View style={styles.separator} />;
}

function ListError({ mensaje, onRetry }: { mensaje: string; onRetry: () => void }) {
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);

  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
      <Text style={styles.errorText}>{mensaje}</Text>
      <Pressable onPress={onRetry}>
        <Text style={styles.retry}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: 4,
    marginBottom: spacing.sm,
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
  separator: {
    height: spacing.sm,
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
  footer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  retry: {
    color: colors.brand,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  });
}
