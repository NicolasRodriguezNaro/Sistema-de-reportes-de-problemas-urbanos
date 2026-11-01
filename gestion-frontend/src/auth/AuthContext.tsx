import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch, setApiToken } from "../api/client";
import type { RolUsuario, TokenResponse, UsuarioResumen } from "../types/api";

const TOKEN_KEY = "reporte-urbano.token";
const USER_KEY = "reporte-urbano.usuario";

interface AuthContextValue {
  usuario: UsuarioResumen | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<UsuarioResumen>;
  cerrarSesion: () => void;
  esAdministrador: boolean;
  esEmpresa: boolean;
  esPersonal: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerUsuarioGuardado(): UsuarioResumen | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioResumen;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<UsuarioResumen | null>(() => leerUsuarioGuardado());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setApiToken(token);

    if (!token) {
      setCargando(false);
      return;
    }

    let cancelado = false;
    apiFetch<UsuarioResumen>("/api/auth/yo")
      .then((perfil) => {
        if (cancelado) return;
        setUsuario(perfil);
        localStorage.setItem(USER_KEY, JSON.stringify(perfil));
      })
      .catch(() => {
        if (cancelado) return;
        setToken(null);
        setUsuario(null);
        setApiToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [token]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const respuesta = await apiFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setApiToken(respuesta.token);
    localStorage.setItem(TOKEN_KEY, respuesta.token);
    localStorage.setItem(USER_KEY, JSON.stringify(respuesta.usuario));
    setToken(respuesta.token);
    setUsuario(respuesta.usuario);
    setCargando(false);
    return respuesta.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    setApiToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo<AuthContextValue>(() => {
    const rol: RolUsuario | undefined = usuario?.rol;
    return {
      usuario,
      cargando,
      iniciarSesion,
      cerrarSesion,
      esAdministrador: rol === "ADMINISTRADOR",
      esEmpresa: rol === "EMPRESA",
      esPersonal: rol === "ADMINISTRADOR" || rol === "FUNCIONARIO" || rol === "EMPRESA",
    };
  }, [cargando, cerrarSesion, iniciarSesion, usuario]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return contexto;
}
