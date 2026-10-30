import { Eye, EyeOff, LockKeyhole, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { usuario, esPersonal, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario && esPersonal) {
      navigate("/dashboard", { replace: true });
    }
  }, [esPersonal, navigate, usuario]);

  if (usuario && esPersonal) {
    return <Navigate to="/dashboard" replace />;
  }

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const perfil = await iniciarSesion(email, password);
      navigate(perfil.rol === "CIUDADANO" ? "/sin-acceso" : "/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.mensaje ?? err.body.error);
      } else {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="brand brand-inverse">
            <div className="brand-mark">
              <ShieldCheck size={24} strokeWidth={2.2} />
            </div>
            <div>
              <strong>Reporte Urbano</strong>
              <span>Gestión de incidencias</span>
            </div>
          </div>

          <div className="login-copy">
            <span className="eyebrow eyebrow-light">SIU Municipal</span>
            <h1>La ciudad se gestiona mejor cuando la información llega a tiempo.</h1>
            <p>
              Un espacio operativo para revisar reportes ciudadanos, priorizar
              incidencias y coordinar a las entidades responsables.
            </p>
          </div>

          <div className="login-features">
            <div>
              <MapPinned size={20} />
              <span>Territorio y reportes en un solo mapa</span>
            </div>
            <div>
              <Sparkles size={20} />
              <span>Clasificación y prioridad asistidas por IA</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>Acceso por rol y entidad responsable</span>
            </div>
          </div>
        </div>
        <div className="login-grid" aria-hidden="true" />
      </section>

      <section className="login-form-panel">
        <div className="login-form-card">
          <div className="login-form-heading">
            <span className="eyebrow">Acceso institucional</span>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa con tus credenciales para continuar.</p>
          </div>

          <form onSubmit={enviar} className="form-stack">
            <label className="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="nombre@municipio.gov.co"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <div className="password-field">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarPassword((valor) => !valor)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <div className="form-error">{error}</div>}

            <button className="button button-primary button-block" type="submit" disabled={enviando}>
              {enviando ? "Ingresando..." : "Iniciar sesión"}
              {!enviando && <LockKeyhole size={17} />}
            </button>
          </form>

          <div className="login-form-footer">
            <span>Acceso para funcionarios, empresas y administradores.</span>
            <span>Ciudadanos: usa la app móvil.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
