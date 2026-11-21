import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TEMA_KEY = "reporte-urbano-tema";
const ESCALA_TEXTO_KEY = "reporte-urbano-escala-texto";
const ESCALA_MINIMA = 0.85;
const ESCALA_MAXIMA = 1.3;
const ESCALA_PASO = 0.15;

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  modo: ThemeMode;
  esOscuro: boolean;
  alternarTema: () => void;
  escalaTexto: number;
  aumentarTexto: () => void;
  disminuirTexto: () => void;
  restablecerTexto: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerTemaInicial(): ThemeMode {
  if (typeof document === "undefined") return "light";
  const atributo = document.documentElement.dataset.theme;
  if (atributo === "dark" || atributo === "light") return atributo;

  try {
    return localStorage.getItem(TEMA_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function aplicarTema(modo: ThemeMode) {
  document.documentElement.dataset.theme = modo;
  try {
    localStorage.setItem(TEMA_KEY, modo);
  } catch {
    // El tema sigue funcionando aunque el navegador no permita persistirlo.
  }
}

function leerEscalaInicial(): number {
  if (typeof document === "undefined") return 1;
  try {
    const guardada = localStorage.getItem(ESCALA_TEXTO_KEY);
    const valor = guardada ? Number.parseFloat(guardada) : 1;
    if (!Number.isFinite(valor)) return 1;
    return Math.min(Math.max(valor, ESCALA_MINIMA), ESCALA_MAXIMA);
  } catch {
    return 1;
  }
}

function normalizarEscala(valor: number) {
  return Math.round(Math.min(Math.max(valor, ESCALA_MINIMA), ESCALA_MAXIMA) * 100) / 100;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ThemeMode>(leerTemaInicial);
  const [escalaTexto, setEscalaTexto] = useState(leerEscalaInicial);

  useEffect(() => {
    aplicarTema(modo);
  }, [modo]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(escalaTexto));
    try {
      localStorage.setItem(ESCALA_TEXTO_KEY, String(escalaTexto));
    } catch {
      // La escala sigue funcionando durante la sesión.
    }
  }, [escalaTexto]);

  const alternarTema = useCallback(() => {
    setModo((actual) => (actual === "light" ? "dark" : "light"));
  }, []);

  const aumentarTexto = useCallback(() => {
    setEscalaTexto((actual) => normalizarEscala(actual + ESCALA_PASO));
  }, []);

  const disminuirTexto = useCallback(() => {
    setEscalaTexto((actual) => normalizarEscala(actual - ESCALA_PASO));
  }, []);

  const restablecerTexto = useCallback(() => {
    setEscalaTexto(1);
  }, []);

  const valor = useMemo<ThemeContextValue>(
    () => ({
      modo,
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

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return contexto;
}
