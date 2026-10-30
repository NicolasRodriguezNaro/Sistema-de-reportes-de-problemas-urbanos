import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "../theme";

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

type TabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  emitter: {
    emit: (evento: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
  };
  navigateToTab: (routeKey: string) => void;
};

const ETIQUETAS: Record<string, string> = {
  index: "Inicio",
  reportar: "Reportar",
  "mis-reportes": "Mis reportes",
  perfil: "Perfil",
};

const ICONOS: Record<
  string,
  { activo: keyof typeof Ionicons.glyphMap; inactivo: keyof typeof Ionicons.glyphMap }
> = {
  index: { activo: "home", inactivo: "home-outline" },
  reportar: { activo: "add-circle", inactivo: "add-circle-outline" },
  "mis-reportes": { activo: "document-text", inactivo: "document-text-outline" },
  perfil: { activo: "person", inactivo: "person-outline" },
};

export function TabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = ETIQUETAS[route.name] ?? route.name;
        const iconos = ICONOS[route.name] ?? ICONOS.index;
        const color = focused ? colors.brand : colors.soft;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const evento = emitter.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !evento.defaultPrevented) {
                navigateToTab(route.key);
              }
            }}
            style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.72 }]}
          >
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? iconos.activo : iconos.inactivo}
                size={route.name === "reportar" ? 25 : 22}
                color={color}
              />
            </View>
            <Text style={[styles.tabText, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 7,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
    paddingTop: 2,
    minHeight: 48,
  },
  tabIconWrap: {
    width: 38,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabIconWrapActive: {
    backgroundColor: colors.mintSoft,
  },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
  },
});
