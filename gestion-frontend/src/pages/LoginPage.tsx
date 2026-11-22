import { Eye, EyeOff, LockKeyhole, MapPinned, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { apiFetch, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import type { CaptchaResponse } from "../types/api";

export function LoginPage() {
  const { usuario, esPersonal, iniciarSesion } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [captchaTexto, setCaptchaTexto] = useState("");
  const [captchaCargando, setCaptchaCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargarCaptcha = useCallback(async () => {
    setCaptchaCargando(true);
    setCaptchaTexto("");
    try {
      const data = await apiFetch<CaptchaResponse>("/api/auth/captcha", { cache: "no-store" });
      setCaptcha(data);
    } catch {
      setCaptcha(null);
      setError("No se pudo cargar el captcha. Intenta actualizarlo.");
    } finally {
      setCaptchaCargando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario && esPersonal) {
      navigate("/dashboard", { replace: true });
    }
  }, [esPersonal, navigate, usuario]);

  useEffect(() => {
    void cargarCaptcha();
  }, [cargarCaptcha]);

  if (usuario && esPersonal) {
    return <Navigate to="/dashboard" replace />;
  }

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!captcha || !captchaTexto.trim()) {
      setError("Completa el código de verificación.");
      return;
    }

    setEnviando(true);
    try {
      const perfil = await iniciarSesion(email, password, captcha.id, captchaTexto.trim());
      navigate(perfil.rol === "CIUDADANO" ? "/sin-acceso" : "/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.mensaje ?? err.body.error);
      } else {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
      await cargarCaptcha();
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
              <span>{t("Gestión de incidencias")}</span>
            </div>
          </div>

          <div className="login-copy">
            <span className="eyebrow eyebrow-light">SIU Municipal</span>
            <h1>{t("La ciudad se gestiona mejor cuando la información llega a tiempo.")}</h1>
            <p>
              {t("Un espacio operativo para revisar reportes ciudadanos, priorizar incidencias y coordinar a las entidades responsables.")}
            </p>
          </div>

          <div className="login-features">
            <div>
              <MapPinned size={20} />
              <span>{t("Territorio y reportes en un solo mapa")}</span>
            </div>
            <div>
              <Sparkles size={20} />
              <span>{t("Clasificación y prioridad asistidas por IA")}</span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>{t("Acceso por rol y entidad responsable")}</span>
            </div>
          </div>
        </div>
        <div className="login-grid" aria-hidden="true" />
      </section>

      <section className="login-form-panel">
        <div className="login-form-card">
          <div className="login-form-heading">
            <span className="eyebrow">{t("Acceso institucional")}</span>
            <h2>{t("Bienvenido de nuevo")}</h2>
            <p>{t("Ingresa con tus credenciales para continuar.")}</p>
          </div>

          <form onSubmit={enviar} className="form-stack">
            <label className="field">
              <span>{t("Correo electrónico")}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t("nombre@municipio.gov.co")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>{t("Contraseña")}</span>
              <div className="password-field">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder={t("Tu contraseña")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarPassword((valor) => !valor)}
                  aria-label={t(mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña")}
                >
                  {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="field">
              <span>{t("Verificación")}</span>
              <div className="captcha-control">
                {captcha ? (
                  <img className="captcha-image" src={captcha.imagen} alt={t("Código captcha")} />
                ) : (
                  <div className="captcha-placeholder">
                    {captchaCargando ? t("Cargando...") : t("Captcha no disponible")}
                  </div>
                )}
                <button
                  type="button"
                  className="button button-secondary captcha-refresh"
                  onClick={() => void cargarCaptcha()}
                  disabled={captchaCargando || enviando}
                >
                  <RefreshCw size={14} />
                  {t("Actualizar")}
                </button>
              </div>
              <input
                type="text"
                name="captchaRespuesta"
                autoComplete="off"
                autoCapitalize="characters"
                placeholder={t("Escribe el código de la imagen")}
                value={captchaTexto}
                onChange={(event) => setCaptchaTexto(event.target.value)}
                required
              />
            </label>

            {error && <div className="form-error">{t(error)}</div>}

            <button className="button button-primary button-block" type="submit" disabled={enviando}>
              {enviando ? t("Ingresando...") : t("Iniciar sesión")}
              {!enviando && <LockKeyhole size={17} />}
            </button>
          </form>

          <div className="login-form-footer">
            <span>{t("Acceso para funcionarios, empresas y administradores.")}</span>
            <span>{t("Ciudadanos: usa la app móvil.")}</span>
          </div>

          <div className="login-language">
            <LanguageSwitcher />
          </div>
        </div>
      </section>
    </div>
  );
}
