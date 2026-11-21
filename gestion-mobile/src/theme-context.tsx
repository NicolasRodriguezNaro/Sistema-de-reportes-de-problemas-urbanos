import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";

import { guardarValor, leerValor } from "./storage";
import { themes, type ThemeColors, type ThemeMode } from "./theme";

export type { ThemeColors } from "./theme";

const TEMA_KEY = "reporte-urbano-tema";

interface ThemeContextValue {
  modo: ThemeMode;
  colores: ThemeColors;
  esOscuro: boolean;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ThemeMode>("light");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    leerValor(TEMA_KEY)
      .then((guardado) => {
        if (activo && (guardado === "light" || guardado === "dark")) {
          setModo(guardado);
        }
      })
      .catch(() => {
        // Si no se puede leer la preferencia, se usa el tema claro.
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const alternarTema = useCallback(() => {
    setModo((actual) => {
      const siguiente: ThemeMode = actual === "light" ? "dark" : "light";
      void guardarValor(TEMA_KEY, siguiente);
      return siguiente;
    });
  }, []);

  const valor = useMemo<ThemeContextValue>(
    () => ({
      modo,
      colores: themes[modo],
      esOscuro: modo === "dark",
      alternarTema,
    }),
    [alternarTema, modo]
  );

  if (cargando) {
    return <View style={{ flex: 1, backgroundColor: themes.light.bg }} />;
  }

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return contexto;
}

export function useThemedStyles<T>(crearEstilos: (colores: ThemeColors) => T): T {
  const { colores } = useTheme();
  return useMemo(() => crearEstilos(colores), [colores, crearEstilos]);
}
