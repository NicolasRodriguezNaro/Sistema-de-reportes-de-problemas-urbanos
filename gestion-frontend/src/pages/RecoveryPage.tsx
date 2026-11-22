import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { apiFetch, ApiError } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";
import type { CaptchaResponse, MensajeResponse } from "../types/api";

type Paso = "solicitar" | "confirmar" | "listo";

export function RecoveryPage() {
  const { t } = useLanguage();
  const [paso, setPaso] = useState<Paso>("solicitar");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [captchaTexto, setCaptchaTexto] = useState("");
  const [captchaCargando, setCaptchaCargando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
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
      setError(t("No se pudo cargar el captcha. Intenta actualizarlo."));
    } finally {
      setCaptchaCargando(false);
    }
  }, [t]);

  useEffect(() => {
    void cargarCaptcha();
  }, [cargarCaptcha]);

  const solicitar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!captcha || !captchaTexto.trim()) {
      setError(t("Completa el código de verificación."));
      return;
    }

    setEnviando(true);
    try {
      await apiFetch<MensajeResponse>("/api/auth/recuperacion", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          captchaId: captcha.id,
          captchaRespuesta: captchaTexto.trim(),
        }),
      });
      setPaso("confirmar");
      setError(null);
    } catch {
      setError(t("No se pudo enviar el código. Intenta de nuevo."));
      await cargarCaptcha();
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (nuevaPassword.length < 8) {
      setError(t("La contraseña debe tener al menos 8 caracteres."));
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError(t("Las contraseñas no coinciden."));
      return;
    }

    setEnviando(true);
    try {
      await apiFetch<MensajeResponse>("/api/auth/recuperacion/confirmar", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          codigo: codigo.trim(),
          nuevaPassword,
        }),
      });
      setPaso("listo");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? t("El código es inválido o expiró.")
          : t("No se pudo restablecer la contraseña. Intenta de nuevo.")
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="recovery-page">
      <div className="recovery-shell">
        <div className="recovery-topbar">
          <Link className="recovery-back" to="/login">
            <ArrowLeft size={16} />
            {t("Volver al acceso")}
          </Link>
          <div className="brand">
            <div className="brand-mark">
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>
            <div>
              <strong>Reporte Urbano</strong>
              <span>{t("Gestión de incidencias")}</span>
            </div>
          </div>
        </div>

        <main className="recovery-card">
          <div className="recovery-icon">
            {paso === "listo" ? <CheckCircle2 size={24} /> : <KeyRound size={24} />}
          </div>

          {paso === "solicitar" && (
            <>
              <span className="eyebrow">{t("Recuperación de acceso")}</span>
              <h1>{t("Recupera tu contraseña")}</h1>
              <p className="recovery-description">
                {t("Escribe tu correo y te enviaremos un código de 6 dígitos para crear una nueva contraseña.")}
              </p>

              <form className="form-stack" onSubmit={solicitar}>
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

                {error && <div className="form-error">{error}</div>}

                <button className="button button-primary button-block" type="submit" disabled={enviando}>
                  <MailCheck size={17} />
                  {enviando ? t("Enviando...") : t("Enviar código")}
                </button>
              </form>
            </>
          )}

          {paso === "confirmar" && (
            <>
              <span className="eyebrow">{t("Revisa tu correo")}</span>
              <h1>{t("Crea una nueva contraseña")}</h1>
              <p className="recovery-description">
                {t("Enviamos un código a {email}. Vence en 10 minutos.", { email })}
              </p>

              <form className="form-stack" onSubmit={confirmar}>
                <label className="field">
                  <span>{t("Código de recuperación")}</span>
                  <input
                    type="text"
                    name="codigo"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t("Escribe el código de 6 dígitos")}
                    value={codigo}
                    onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ""))}
                    required
                  />
                </label>

                <label className="field">
                  <span>{t("Nueva contraseña")}</span>
                  <input
                    type="password"
                    name="nuevaPassword"
                    autoComplete="new-password"
                    placeholder={t("Mínimo 8 caracteres")}
                    value={nuevaPassword}
                    onChange={(event) => setNuevaPassword(event.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>

                <label className="field">
                  <span>{t("Confirmar contraseña")}</span>
                  <input
                    type="password"
                    name="confirmarPassword"
                    autoComplete="new-password"
                    placeholder={t("Repite la nueva contraseña")}
                    value={confirmarPassword}
                    onChange={(event) => setConfirmarPassword(event.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>

                {error && <div className="form-error">{error}</div>}

                <button className="button button-primary button-block" type="submit" disabled={enviando}>
                  {enviando ? t("Guardando...") : t("Restablecer contraseña")}
                </button>
                <button
                  className="button button-secondary button-block"
                  type="button"
                  onClick={() => {
                    setPaso("solicitar");
                    setError(null);
                    void cargarCaptcha();
                  }}
                  disabled={enviando}
                >
                  {t("Usar otro correo")}
                </button>
              </form>
            </>
          )}

          {paso === "listo" && (
            <>
              <span className="eyebrow">{t("Listo")}</span>
              <h1>{t("Contraseña actualizada")}</h1>
              <p className="recovery-description">
                {t("Ya puedes iniciar sesión con tu nueva contraseña.")}
              </p>
              <Link className="button button-primary button-block" to="/login">
                {t("Volver al inicio de sesión")}
              </Link>
            </>
          )}

          {paso === "solicitar" && (
            <p className="recovery-footer">
              {t("¿Recordaste tu contraseña?")}{" "}
              <Link to="/login">{t("Iniciar sesión")}</Link>
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
