import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../../auth";
import { ReportDetailScreen } from "../../screens/ReportDetailScreen";
import { useTheme, useThemedStyles, type ThemeColors } from "../../theme-context";

export default function ReportDetailRoute() {
  const { usuario, cargando } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!usuario) return <Redirect href="/login" />;
  if (!id) return <Redirect href="/" />;

  return <ReportDetailScreen id={Number(id)} />;
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
  });
}
