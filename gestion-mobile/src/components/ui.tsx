import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "./AppText";
import { fonts, radius, shadows, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";
import type {
  EstadoReporte,
  PrioridadCalculada,
  ReporteResumen,
  TipoIncidencia,
} from "../types";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../types";

function useStyles() {
  const { colores: colors, escalaTexto } = useTheme();
  const styles = useThemedStyles(crearEstilos);
  return { colors, styles, escalaTexto };
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { styles } = useStyles();

  return (
    <SafeAreaView style={[styles.screen, style]} edges={["top", "left", "right"]}>
      {children}
    </SafeAreaView>
  );
}

export function BrandMark({ small = false }: { small?: boolean }) {
  const { colors, styles } = useStyles();

  return (
    <View style={[styles.brandMark, small && styles.brandMarkSmall]}>
      <Ionicons name="shield-checkmark" size={small ? 20 : 25} color={colors.brandDeep} />
    </View>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  const { colors, styles } = useStyles();

  return (
    <View style={styles.brandRow}>
      <BrandMark small />
      <View>
        <Text style={[styles.brandName, light && { color: colors.white }]}>Reporte Urbano</Text>
        <Text style={[styles.brandSub, light && { color: "rgba(230,250,247,0.62)" }]}>
          Gestión de incidencias
        </Text>
      </View>
    </View>
  );
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "accent";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, styles } = useStyles();
  const deshabilitado = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado, busy: loading }}
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "secondary" && styles.buttonSecondary,
        variant === "accent" && styles.buttonAccent,
        variant === "ghost" && styles.buttonGhost,
        deshabilitado && styles.buttonDisabled,
        pressed && !deshabilitado && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.brand : colors.white} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={variant === "secondary" || variant === "ghost" ? colors.brand : colors.white}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              variant === "secondary" && styles.buttonTextSecondary,
              variant === "ghost" && styles.buttonTextGhost,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  multiline = false,
  error,
  autoCapitalize = "none",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  error?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const { colors, styles, escalaTexto } = useStyles();
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, enfocado && styles.fieldBoxFocused, error && styles.fieldBoxError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.soft}
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          style={[
            styles.textInput,
            multiline && styles.textArea,
            { fontSize: 14 * escalaTexto },
          ]}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            onPress={() => setVisible((estado) => !estado)}
            hitSlop={10}
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.soft} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function StatusBadge({ estado }: { estado: EstadoReporte }) {
  const { colors, styles } = useStyles();
  const estilos: Record<EstadoReporte, { bg: string; text: string; dot: string }> = {
    PENDIENTE: { bg: colors.accentSoft, text: colors.accentText, dot: colors.accent },
    EN_REVISION: { bg: colors.infoSoft, text: colors.infoText, dot: colors.info },
    ASIGNADO: { bg: colors.violetSoft, text: colors.violet, dot: colors.violet },
    RESUELTO: { bg: colors.successSoft, text: colors.success, dot: colors.success },
    RECHAZADO: { bg: colors.dangerSoft, text: colors.danger, dot: colors.danger },
  };
  const color = estilos[estado];

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: color.dot }]} />
      <Text style={[styles.badgeText, { color: color.text }]}>{ETIQUETAS_ESTADO[estado]}</Text>
    </View>
  );
}

export function PriorityBadge({ prioridad }: { prioridad: PrioridadCalculada | null }) {
  const { colors, styles } = useStyles();
  if (!prioridad) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.badgeText, { color: colors.soft }]}>Sin calcular</Text>
      </View>
    );
  }

  const estilos: Record<PrioridadCalculada, { bg: string; text: string }> = {
    BAJA: { bg: colors.successSoft, text: colors.success },
    MEDIA: { bg: colors.infoSoft, text: colors.info },
    ALTA: { bg: colors.accentSoft, text: colors.accentText },
    CRITICA: { bg: colors.dangerSoft, text: colors.danger },
  };
  const color = estilos[prioridad];

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.badgeText, { color: color.text }]}>{ETIQUETAS_PRIORIDAD[prioridad]}</Text>
    </View>
  );
}

export function LoadingView({ label = "Cargando..." }: { label?: string }) {
  const { colors, styles } = useStyles();

  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.brand} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyView({
  title,
  description,
  icon = "file-tray-outline",
  action,
}: {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: ReactNode;
}) {
  const { colors, styles } = useStyles();

  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={25} color={colors.brand} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{description}</Text>
      {action}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors, styles } = useStyles();

  return (
    <View style={[styles.stateBox, styles.errorBox]}>
      <View style={[styles.stateIcon, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={25} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>Algo no salió bien</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry && <AppButton title="Reintentar" variant="secondary" icon="refresh-outline" onPress={onRetry} />}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const { styles } = useStyles();

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function ReportCard({
  reporte,
  onPress,
}: {
  reporte: ReporteResumen;
  onPress: () => void;
}) {
  const { colors, styles } = useStyles();
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.reportCard, pressed && styles.cardPressed]}
    >
      {reporte.urlImagenThumb && !imageError ? (
        <Image
          source={{ uri: reporte.urlImagenThumb }}
          style={styles.reportImage}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.reportImage, styles.reportImageEmpty]}>
          <Ionicons name="image-outline" size={22} color={colors.soft} />
        </View>
      )}
      <View style={styles.reportContent}>
        <View style={styles.reportTopLine}>
          <Text style={styles.reportCategory}>
            {reporte.categoriaIa ? ETIQUETAS_CATEGORIA[reporte.categoriaIa] : "Sin clasificar"}
          </Text>
          <StatusBadge estado={reporte.estado} />
        </View>
        <Text style={styles.reportDescription} numberOfLines={2}>
          {reporte.descripcion || "Sin descripción"}
        </Text>
        <View style={styles.reportBottomLine}>
          <View style={styles.reportLocation}>
            <Ionicons name="location-outline" size={14} color={colors.soft} />
            <Text style={styles.reportMetaText}>
              {reporte.barrioNombre ??
                (reporte.barrioId ? `Barrio ${reporte.barrioId}` : "Sin barrio")}
            </Text>
          </View>
          <Text style={styles.reportDate}>
            {new Date(reporte.fechaCreacion).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
            })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function CategoryIcon({ categoria }: { categoria: TipoIncidencia | null }) {
  const { colors } = useStyles();
  const iconos: Record<TipoIncidencia, keyof typeof Ionicons.glyphMap> = {
    HUECO_VIA: "car-outline",
    FUGA_AGUA: "water-outline",
    FALLA_ALUMBRADO: "flashlight-outline",
    ACUMULACION_BASURA: "trash-outline",
  };
  return (
    <Ionicons
      name={categoria ? iconos[categoria] : "help-circle-outline"}
      size={19}
      color={colors.brand}
    />
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mint,
  },
  brandMarkSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  brandName: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  brandSub: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 1,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.brand,
  },
  buttonAccent: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: colors.brand,
  },
  buttonTextGhost: {
    color: colors.brand,
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  fieldBox: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldBoxFocused: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  fieldBoxError: {
    borderColor: colors.danger,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: "top",
  },
  fieldError: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBox: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  stateIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  stateTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 16,
    textAlign: "center",
  },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  reportCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.8,
  },
  reportImage: {
    width: 64,
    height: 74,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  reportImageEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  reportContent: {
    flex: 1,
    gap: 5,
  },
  reportTopLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  reportCategory: {
    flex: 1,
    color: colors.brand,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  reportDescription: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
  },
  reportBottomLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    gap: 6,
  },
  reportLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  reportMetaText: {
    color: colors.soft,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  reportDate: {
    color: colors.soft,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  });
}
