import {
  StyleSheet,
  Text as TextNativo,
  type TextProps,
} from "react-native";

import { useTheme } from "../theme-context";

/**
 * Texto de la aplicación que respeta la escala elegida por el usuario.
 * La escala se aplica sobre fontSize, lineHeight y letterSpacing.
 */
export function Text({ style, ...props }: TextProps) {
  const { escalaTexto } = useTheme();
  const plano = StyleSheet.flatten(style);

  const escalado =
    escalaTexto === 1 || !plano
      ? undefined
      : {
          fontSize:
            typeof plano.fontSize === "number"
              ? plano.fontSize * escalaTexto
              : undefined,
          lineHeight:
            typeof plano.lineHeight === "number"
              ? plano.lineHeight * escalaTexto
              : undefined,
          letterSpacing:
            typeof plano.letterSpacing === "number"
              ? plano.letterSpacing * escalaTexto
              : undefined,
        };

  return <TextNativo {...props} style={[style, escalado]} />;
}
