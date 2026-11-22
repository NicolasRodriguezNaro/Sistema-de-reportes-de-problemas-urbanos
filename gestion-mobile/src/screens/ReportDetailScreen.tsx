import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiFetch } from "../api";
import { Text } from "../components/AppText";
import { useLanguage } from "../i18n";
import {
  ErrorView,
  LoadingView,
  PriorityBadge,
  StatusBadge,
} from "../components/ui";
import { fonts, radius, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";
import type { HistorialReporte, ReporteDetalle } from "../types";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO,
  ETIQUETAS_MOTIVO_RECHAZO,
  ETIQUETAS_SEVERIDAD,
} from "../types";

async function obtenerReporte(id: number) {
  return Promise.all([
    apiFetch<ReporteDetalle>(`/api/reportes/${id}`),
    apiFetch<HistorialReporte[]>(`/api/reportes/${id}/historial`).catch(
      () => [] as HistorialReporte[]
    ),
  ]);
}

export function ReportDetailScreen({ id }: { id: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);
  const { t, locale } = useLanguage();
  const [reporte, setReporte] = useState<ReporteDetalle | null>(null);
  const [historial, setHistorial] = useState<HistorialReporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenHdVisible, setImagenHdVisible] = useState(false);
  const [errorMiniatura, setErrorMiniatura] = useState(false);
  const [errorHd, setErrorHd] = useState(false);

  const reintentar = useCallback(() => {
    setCargando(true);
    setError(null);
    setImagenHdVisible(false);
    setErrorMiniatura(false);
    setErrorHd(false);
    obtenerReporte(id)
      .then(([data, historialData]) => {
        setReporte(data);
        setHistorial(historialData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar el reporte.");
      })
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    let activo = true;

    obtenerReporte(id)
      .then(([data, historialData]) => {
        if (!activo) return;
        setReporte(data);
        setHistorial(historialData);
        setImagenHdVisible(false);
        setErrorMiniatura(false);
        setErrorHd(false);
      })
      .catch((err: unknown) => {
        if (activo) setError(err instanceof Error ? err.message : "No se pudo cargar el reporte.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <BackButton onPress={() => router.back()} />
        <LoadingView label="Cargando tu reporte..." />
      </View>
    );
  }

  if (error || !reporte) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <BackButton onPress={() => router.back()} />
        <ErrorView message={error ?? "Reporte no encontrado"} onRetry={reintentar} />
      </View>
    );
  }

  const mostrarMiniatura = Boolean(reporte.urlImagenThumb) && !errorMiniatura;
  const mostrarHd = Boolean(reporte.urlImagenHd) && !errorHd;
  const sinImagen = !mostrarMiniatura && !mostrarHd;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.imageWrap, { paddingTop: insets.top + 10 }]}>
          <View style={styles.imageStack}>
            {mostrarMiniatura && (
              <Image
                source={{ uri: reporte.urlImagenThumb! }}
                style={styles.image}
                onError={() => setErrorMiniatura(true)}
              />
            )}
            {mostrarHd && (
              <Image
                source={{ uri: reporte.urlImagenHd! }}
                style={[
                  styles.image,
                  mostrarMiniatura && styles.imageOverlay,
                  mostrarMiniatura && !imagenHdVisible && styles.imageOculta,
                ]}
                onLoad={() => setImagenHdVisible(true)}
                onError={() => setErrorHd(true)}
              />
            )}
            {sinImagen && (
              <View style={[styles.image, styles.imageEmpty]}>
                <Ionicons name="image-outline" size={36} color={colors.soft} />
                <Text style={styles.imageEmptyText}>Imagen no disponible</Text>
              </View>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + 12 }]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.kicker}>{t("REPORTE #{id}", { id: reporte.id })}</Text>
              <Text style={styles.title}>
                {reporte.categoriaIa ? ETIQUETAS_CATEGORIA[reporte.categoriaIa] : "Incidencia urbana"}
              </Text>
            </View>
            <View style={styles.badges}>
              <StatusBadge estado={reporte.estado} />
              <PriorityBadge prioridad={reporte.prioridadCalculada} />
            </View>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.soft} />
            <Text style={styles.dateText}>
              Reportado el{" "}
              {new Date(reporte.fechaCreacion).toLocaleDateString(locale, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardKicker}>DESCRIPCIÓN</Text>
            <Text style={styles.description}>
              {reporte.descripcion || "El reporte no incluye una descripción adicional."}
            </Text>
          </View>

          {reporte.estado === "RECHAZADO" && (
            <View style={styles.rejectionCard}>
              <View style={styles.rejectionHeader}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
                <Text style={styles.rejectionTitle}>Reporte rechazado</Text>
              </View>
              <Text style={styles.rejectionReason}>
                {reporte.motivoRechazo
                  ? ETIQUETAS_MOTIVO_RECHAZO[reporte.motivoRechazo]
                  : "No se registró un motivo."}
              </Text>
              {reporte.detalleRechazo && (
                <Text style={styles.rejectionDetail}>{reporte.detalleRechazo}</Text>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardKicker}>UBICACIÓN</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={21} color={colors.brand} />
              </View>
              <View>
                <Text style={styles.locationTitle}>
                  {reporte.barrioNombre ??
                    (reporte.barrioId ? `${t("Barrio")} ${reporte.barrioId}` : t("Punto del reporte"))}
                </Text>
                <Text style={styles.locationCoords}>
                  {reporte.latitud.toFixed(5)}, {reporte.longitud.toFixed(5)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardKicker}>HISTORIAL DE ESTADOS</Text>
            {historial.length > 0 ? (
              historial.map((evento) => (
                <View key={evento.id} style={styles.historyRow}>
                  <View style={styles.historyRail}>
                    <View
                      style={[
                        styles.historyDot,
                        evento.estadoNuevo === "RECHAZADO" && styles.historyDotDanger,
                      ]}
                    />
                  </View>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyTitle}>
                      {evento.estadoAnterior
                        ? `${t(ETIQUETAS_ESTADO[evento.estadoAnterior])} → ${t(ETIQUETAS_ESTADO[evento.estadoNuevo])}`
                        : t(ETIQUETAS_ESTADO[evento.estadoNuevo])}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {new Date(evento.fecha).toLocaleDateString(locale, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {evento.usuarioNombre}
                    </Text>
                    {evento.motivo && (
                      <Text style={styles.historyReason}>
                        {t(ETIQUETAS_MOTIVO_RECHAZO[evento.motivo])}
                        {evento.detalle ? ` · ${evento.detalle}` : ""}
                      </Text>
                    )}
                    {evento.motivoReapertura && (
                      <Text style={styles.historyReopen}>
                        {t("Motivo de reapertura: {motivo}", { motivo: evento.motivoReapertura })}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.description}>
                Este reporte no tiene movimientos de estado registrados.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardKicker}>FICHA DEL REPORTE</Text>
            <MetaRow label="Severidad" value={reporte.severidadIa ? ETIQUETAS_SEVERIDAD[reporte.severidadIa] : "Sin calcular"} />
            <MetaRow
              label="Confianza IA"
              value={reporte.confianzaIa ? `${Math.round(reporte.confianzaIa * 100)}%` : "No disponible"}
            />
            <MetaRow
              label="Entidad responsable"
              value={
                reporte.entidadNombre ??
                (reporte.entidadAsignadaId
                  ? `${t("Entidad")} ${reporte.entidadAsignadaId}`
                  : t("Por asignar"))
              }
            />
            <MetaRow label="Reporte padre" value={reporte.reportePadreId ? `#${reporte.reportePadreId}` : t("Ninguno")} />
          </View>

          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={19} color={colors.brand} />
            <Text style={styles.noticeText}>
              El ciudadano puede consultar el estado del caso. Los cambios de estado los realiza el equipo municipal.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onPress} style={styles.backButtonDark}>
      <Ionicons name="arrow-back" size={21} color={colors.brand} />
    </Pressable>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(crearEstilos);

  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  imageWrap: {
    marginHorizontal: -spacing.lg,
    position: "relative",
  },
  imageStack: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 290,
    backgroundColor: colors.surfaceMuted,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  imageOculta: {
    opacity: 0,
  },
  imageEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  imageEmptyText: {
    color: colors.soft,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  backButton: {
    position: "absolute",
    left: spacing.lg,
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,46,56,0.58)",
  },
  backButtonDark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  content: {
    marginTop: -spacing.xl,
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  titleCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.7,
    marginTop: 4,
  },
  badges: {
    alignItems: "flex-end",
    gap: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    color: colors.soft,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardKicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  locationTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  locationCoords: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLabel: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  metaValue: {
    maxWidth: "58%",
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 10,
    textAlign: "right",
  },
  rejectionCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rejectionTitle: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  rejectionReason: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  rejectionDetail: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  historyRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  historyRail: {
    width: 10,
    alignItems: "center",
  },
  historyDot: {
    width: 8,
    height: 8,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  historyDotDanger: {
    backgroundColor: colors.danger,
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 10,
  },
  historyMeta: {
    color: colors.soft,
    fontFamily: fonts.regular,
    fontSize: 9,
  },
  historyReason: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 14,
  },
  historyReopen: {
    color: colors.success,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 14,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  noticeText: {
    flex: 1,
    color: colors.brand,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 16,
  },
  });
}
