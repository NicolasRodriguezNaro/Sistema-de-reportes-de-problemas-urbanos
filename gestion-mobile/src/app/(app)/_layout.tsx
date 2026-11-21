import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../../auth";
import { TabBar } from "../../components/TabBar";
import { useTheme, useThemedStyles, type ThemeColors } from "../../theme-context";

export default function AppLayout() {
  const { usuario, cargando } = useAuth();
  const { colores: colors } = useTheme();
  const styles = useThemedStyles(crearEstilos);

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="reportar" options={{ title: "Reportar" }} />
      <Tabs.Screen name="mis-reportes" options={{ title: "Mis reportes" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
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
