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

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  modo: ThemeMode;
  esOscuro: boolean;
  alternarTema: () => void;
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ThemeMode>(leerTemaInicial);

  useEffect(() => {
    aplicarTema(modo);
  }, [modo]);

  const alternarTema = useCallback(() => {
    setModo((actual) => (actual === "light" ? "dark" : "light"));
  }, []);

  const valor = useMemo<ThemeContextValue>(
    () => ({
      modo,
      esOscuro: modo === "dark",
      alternarTema,
    }),
    [alternarTema, modo]
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
