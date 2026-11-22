import { useLanguage } from "../i18n/LanguageContext";

export function LanguageSwitcher() {
  const { idioma, cambiarIdioma, t } = useLanguage();

  return (
    <div className="language-switcher" aria-label={t("Idioma")}>
      <button
        type="button"
        className={idioma === "es" ? "is-active" : ""}
        onClick={() => cambiarIdioma("es")}
        aria-pressed={idioma === "es"}
      >
        Español
      </button>
      <button
        type="button"
        className={idioma === "en" ? "is-active" : ""}
        onClick={() => cambiarIdioma("en")}
        aria-pressed={idioma === "en"}
      >
        English
      </button>
    </div>
  );
}
