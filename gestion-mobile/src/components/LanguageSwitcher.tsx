import { Pressable, StyleSheet, View } from "react-native";

import { useLanguage } from "../i18n";
import { fonts, radius, spacing } from "../theme";
import { useThemedStyles, type ThemeColors } from "../theme-context";
import { Text } from "./AppText";

export function LanguageSwitcher() {
  const { idioma, cambiarIdioma } = useLanguage();
  const styles = useThemedStyles(crearEstilos);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: idioma === "es" }}
        onPress={() => cambiarIdioma("es")}
        style={[styles.option, idioma === "es" && styles.optionActive]}
      >
        <Text traducir={false} style={[styles.text, idioma === "es" && styles.textActive]}>
          Español
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: idioma === "en" }}
        onPress={() => cambiarIdioma("en")}
        style={[styles.option, idioma === "en" && styles.optionActive]}
      >
        <Text traducir={false} style={[styles.text, idioma === "en" && styles.textActive]}>
          English
        </Text>
      </Pressable>
    </View>
  );
}

function crearEstilos(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-end",
    },
    option: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.full,
    },
    optionActive: {
      backgroundColor: colors.mintSoft,
    },
    text: {
      color: colors.soft,
      fontFamily: fonts.medium,
      fontSize: 10,
    },
    textActive: {
      color: colors.brand,
      fontFamily: fonts.bold,
    },
  });
}
