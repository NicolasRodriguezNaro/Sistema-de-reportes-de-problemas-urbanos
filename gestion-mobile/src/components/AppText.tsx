import type { ReactNode } from "react";
import {
  StyleSheet,
  Text as TextNativo,
  type TextProps,
} from "react-native";

import { useLanguage } from "../i18n";
import { useTheme } from "../theme-context";

/**
 * Texto de la aplicación que respeta la escala elegida por el usuario.
 * La escala se aplica sobre fontSize, lineHeight y letterSpacing.
 */
function traducirHijos(
  children: ReactNode,
  traducir: (texto: string) => string
): ReactNode {
  if (typeof children === "string") return traducir(children);
  if (Array.isArray(children)) {
    return children.map((hijo) =>
      typeof hijo === "string" ? traducir(hijo) : hijo
    );
  }
  return children;
}

export function Text({
  style,
  children,
  traducir = true,
  ...props
}: TextProps & { traducir?: boolean }) {
  const { escalaTexto } = useTheme();
  const { t } = useLanguage();
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

  return (
    <TextNativo {...props} style={[style, escalado]}>
      {traducir ? traducirHijos(children, t) : children}
    </TextNativo>
  );
}
