import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch, setApiToken } from "./api";
import { borrarValor, guardarValor, leerValor } from "./storage";
import type { TokenResponse, UsuarioResumen } from "./types";

const TOKEN_KEY = "reporte-urbano-token";
const USER_KEY = "reporte-urbano-usuario";

interface AuthContextValue {
  usuario: UsuarioResumen | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<UsuarioResumen>;
  registrar: (nombre: string, email: string, password: string) => Promise<UsuarioResumen>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function guardarSesion(respuesta: TokenResponse) {
  setApiToken(respuesta.token);
  await guardarValor(TOKEN_KEY, respuesta.token);
  await guardarValor(USER_KEY, JSON.stringify(respuesta.usuario));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResumen | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let montado = true;

    async function restaurar() {
      try {
        const [token, usuarioGuardado] = await Promise.all([
          leerValor(TOKEN_KEY),
          leerValor(USER_KEY),
        ]);

        if (!token) {
          return;
        }

        setApiToken(token);
        if (usuarioGuardado) {
          try {
            setUsuario(JSON.parse(usuarioGuardado) as UsuarioResumen);
          } catch {
            await borrarValor(USER_KEY);
          }
        }

        const perfil = await apiFetch<UsuarioResumen>("/api/auth/yo");
        if (montado) {
          setUsuario(perfil);
          await guardarValor(USER_KEY, JSON.stringify(perfil));
        }
      } catch {
        setApiToken(null);
        await borrarValor(TOKEN_KEY);
        await borrarValor(USER_KEY);
        if (montado) setUsuario(null);
      } finally {
        if (montado) setCargando(false);
      }
    }

    void restaurar();
    return () => {
      montado = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const respuesta = await apiFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await guardarSesion(respuesta);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }, []);

  const registrar = useCallback(async (nombre: string, email: string, password: string) => {
    const respuesta = await apiFetch<TokenResponse>("/api/auth/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, email, password }),
    });
    await guardarSesion(respuesta);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    setApiToken(null);
    await borrarValor(TOKEN_KEY);
    await borrarValor(USER_KEY);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, registrar, cerrarSesion }),
    [usuario, cargando, iniciarSesion, registrar, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return contexto;
}
