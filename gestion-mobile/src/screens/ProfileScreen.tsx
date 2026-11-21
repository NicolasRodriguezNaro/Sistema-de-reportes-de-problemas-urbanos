import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { useAuth } from "../auth";
import { AppButton, Brand, Screen } from "../components/ui";
import { fonts, radius, spacing } from "../theme";
import { useTheme, useThemedStyles, type ThemeColors } from "../theme-context";

export function ProfileScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const { colores: colors, esOscuro, alternarTema } = useTheme();
  const styles = useThemedStyles(crearEstilos);

  if (!usuario) return null;

  const iniciales = usuario.nombre
    .split(" ")
    .slice(0, 2)
    .map((parte: string) => parte.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Brand />
          <Text style={styles.kicker}>TU CUENTA</Text>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Información de tu cuenta ciudadana.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
          <Text style={styles.name}>{usuario.nombre}</Text>
          <Text style={styles.role}>Ciudadano</Text>
        </View>

        <View style={styles.card}>
          <InfoRow icon="mail-outline" label="Correo electrónico" value={usuario.email} />
          <InfoRow icon="person-outline" label="Nombre" value={usuario.nombre} />
          <InfoRow icon="shield-checkmark-outline" label="Rol" value="Ciudadano" />
          {usuario.entidadNombre && (
            <InfoRow icon="business-outline" label="Entidad" value={usuario.entidadNombre} />
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.helpRow}>
            <View style={styles.helpIcon}>
              <Ionicons name="leaf-outline" size={20} color={colors.brand} />
            </View>
            <View style={styles.helpCopy}>
              <Text style={styles.helpTitle}>Reportar también construye ciudad</Text>
              <Text style={styles.helpText}>
                Cada incidencia que envías ayuda a priorizar el mantenimiento de los espacios públicos.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons
                name={esOscuro ? "moon-outline" : "sunny-outline"}
                size={19}
                color={colors.brand}
              />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Tema oscuro</Text>
              <Text style={styles.settingText}>
                Cambia la apariencia de Reporte Urbano.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Cambiar tema de la aplicación"
              value={esOscuro}
              onValueChange={alternarTema}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <AppButton
          title="Cerrar sesión"
          variant="secondary"
          icon="log-out-outline"
          onPress={() => void cerrarSesion()}
        />

        <Text style={styles.version}>Reporte Urbano · Versión 1.0</Text>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={colors.brand} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  top: {
    gap: 5,
  },
  kicker: {
    color: colors.soft,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.3,
    marginTop: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    letterSpacing: -0.9,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  profileCard: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.brand,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mint,
  },
  avatarText: {
    color: colors.brandDeep,
    fontFamily: fonts.extraBold,
    fontSize: 24,
  },
  name: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    marginTop: spacing.md,
  },
  role: {
    color: "rgba(230,250,247,0.65)",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  settingText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  infoCopy: {
    flex: 1,
  },
  infoLabel: {
    color: colors.soft,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  infoValue: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 12,
    marginTop: 2,
  },
  helpRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintSoft,
  },
  helpCopy: {
    flex: 1,
  },
  helpTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  helpText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },
  version: {
    textAlign: "center",
    color: colors.soft,
    fontFamily: fonts.regular,
    fontSize: 9,
  },
  });
}
