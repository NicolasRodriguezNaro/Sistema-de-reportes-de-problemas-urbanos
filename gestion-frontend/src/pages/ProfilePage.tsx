import { Building2, Languages, LogOut, Mail, Moon, RotateCcw, ShieldCheck, Sun, Type, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageHeader } from "../components/PageHeader";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../theme/ThemeContext";
import { ETIQUETAS_ROL, iniciales } from "../utils/format";

export function ProfilePage() {
  const { usuario, cerrarSesion } = useAuth();
  const { t } = useLanguage();
  const {
    esOscuro,
    alternarTema,
    escalaTexto,
    aumentarTexto,
    disminuirTexto,
    restablecerTexto,
  } = useTheme();
  const navigate = useNavigate();

  if (!usuario) return null;

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("Cuenta")}
        titulo={t("Perfil de usuario")}
        descripcion={t("Información de la sesión y del alcance asignado.")}
      />

      <section className="profile-grid">
        <article className="panel profile-card">
          <div className="avatar avatar-large">{iniciales(usuario.nombre)}</div>
          <h2>{usuario.nombre}</h2>
          <span className="profile-role">{t(ETIQUETAS_ROL[usuario.rol])}</span>
          <button className="button button-secondary" onClick={salir}>
            <LogOut size={16} />
            {t("Cerrar sesión")}
          </button>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t("Datos de acceso")}</span>
              <h2>{t("Información de la cuenta")}</h2>
            </div>
          </div>
          <div className="metadata-list">
            <div>
              <span><UserRound size={15} /> {t("Nombre")}</span>
              <strong>{usuario.nombre}</strong>
            </div>
            <div>
              <span><Mail size={15} /> {t("Correo")}</span>
              <strong>{usuario.email}</strong>
            </div>
            <div>
              <span><ShieldCheck size={15} /> {t("Rol")}</span>
              <strong>{t(ETIQUETAS_ROL[usuario.rol])}</strong>
            </div>
            <div>
              <span><Building2 size={15} /> {t("Entidad")}</span>
              <strong>
                {usuario.entidadNombre ??
                  (usuario.entidadId
                    ? `${t("Entidad")} ${usuario.entidadId}`
                    : t("No asignada"))}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel profile-theme-panel">
        <div className="theme-setting-row">
          <div className="theme-setting-icon">
            <Languages size={20} />
          </div>
          <div className="theme-setting-copy">
            <span className="eyebrow">{t("Idioma")}</span>
            <h2>{t("Idioma de la interfaz")}</h2>
            <p>{t("Elige el idioma de la aplicación.")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="theme-setting-divider" />

        <div className="theme-setting-row">
          <div className="theme-setting-icon">
            {esOscuro ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <div className="theme-setting-copy">
            <span className="eyebrow">{t("Apariencia")}</span>
            <h2>{t("Tema de la interfaz")}</h2>
            <p>{t("Cambia entre la apariencia clara y oscura del panel.")}</p>
          </div>
          <div className="theme-setting-action">
            <span>{t(esOscuro ? "Oscuro" : "Claro")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={esOscuro}
              aria-label={t("Cambiar tema de la interfaz")}
              className={`theme-switch ${esOscuro ? "is-active" : ""}`}
              onClick={alternarTema}
            >
              <span className="theme-switch-thumb" />
            </button>
          </div>
        </div>

        <div className="theme-setting-divider" />

        <div className="theme-setting-row">
          <div className="theme-setting-icon">
            <Type size={20} />
          </div>
          <div className="theme-setting-copy">
            <span className="eyebrow">{t("Lectura")}</span>
            <h2>{t("Tamaño de letra")}</h2>
            <p>
              {Math.round(escalaTexto * 100)}% · {t("Ajusta el texto de todo el panel.")}
            </p>
          </div>
          <div className="theme-setting-action">
            <div className="font-size-actions">
              <button
                type="button"
                className="font-size-button"
                onClick={disminuirTexto}
                disabled={escalaTexto <= 0.85}
                aria-label={t("Disminuir tamaño de letra")}
              >
                A−
              </button>
              <button
                type="button"
                className="font-size-reset"
                onClick={restablecerTexto}
                aria-label={t("Restablecer tamaño de letra")}
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                className="font-size-button"
                onClick={aumentarTexto}
                disabled={escalaTexto >= 1.3}
                aria-label={t("Aumentar tamaño de letra")}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
