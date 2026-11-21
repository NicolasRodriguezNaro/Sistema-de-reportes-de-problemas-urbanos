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
const ESCALA_TEXTO_KEY = "reporte-urbano-escala-texto";
const ESCALA_MINIMA = 0.85;
const ESCALA_MAXIMA = 1.3;
const ESCALA_PASO = 0.15;

interface ThemeContextValue {
  modo: ThemeMode;
  colores: ThemeColors;
  esOscuro: boolean;
  alternarTema: () => void;
  escalaTexto: number;
  aumentarTexto: () => void;
  disminuirTexto: () => void;
  restablecerTexto: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ThemeMode>("light");
  const [escalaTexto, setEscalaTexto] = useState(1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    Promise.all([leerValor(TEMA_KEY), leerValor(ESCALA_TEXTO_KEY)])
      .then(([temaGuardado, escalaGuardada]) => {
        if (!activo) return;

        if (temaGuardado === "light" || temaGuardado === "dark") {
          setModo(temaGuardado);
        }

        if (escalaGuardada) {
          const escala = Number.parseFloat(escalaGuardada);
          if (Number.isFinite(escala)) {
            setEscalaTexto(Math.min(Math.max(escala, ESCALA_MINIMA), ESCALA_MAXIMA));
          }
        }
      })
      .catch(() => {
        // Si no se pueden leer las preferencias, se usan los valores por defecto.
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

  const guardarEscala = useCallback((siguiente: number) => {
    const normalizada = Math.round(siguiente * 100) / 100;
    setEscalaTexto(normalizada);
    void guardarValor(ESCALA_TEXTO_KEY, String(normalizada));
  }, []);

  const aumentarTexto = useCallback(() => {
    setEscalaTexto((actual) => {
      const siguiente = Math.min(actual + ESCALA_PASO, ESCALA_MAXIMA);
      const normalizada = Math.round(siguiente * 100) / 100;
      void guardarValor(ESCALA_TEXTO_KEY, String(normalizada));
      return normalizada;
    });
  }, []);

  const disminuirTexto = useCallback(() => {
    setEscalaTexto((actual) => {
      const siguiente = Math.max(actual - ESCALA_PASO, ESCALA_MINIMA);
      const normalizada = Math.round(siguiente * 100) / 100;
      void guardarValor(ESCALA_TEXTO_KEY, String(normalizada));
      return normalizada;
    });
  }, []);

  const restablecerTexto = useCallback(() => {
    guardarEscala(1);
  }, [guardarEscala]);

  const valor = useMemo<ThemeContextValue>(
    () => ({
      modo,
      colores: themes[modo],
      esOscuro: modo === "dark",
      alternarTema,
      escalaTexto,
      aumentarTexto,
      disminuirTexto,
      restablecerTexto,
    }),
    [
      alternarTema,
      aumentarTexto,
      disminuirTexto,
      escalaTexto,
      modo,
      restablecerTexto,
    ]
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
