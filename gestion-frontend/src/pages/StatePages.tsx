import { ArrowRight, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext";

export function AccessDeniedPage() {
  const { t } = useLanguage();
  return (
    <div className="standalone-state-page">
      <div className="standalone-state-card">
        <div className="state-icon state-icon-large">
          <Smartphone size={26} />
        </div>
        <span className="eyebrow">{t("Acceso restringido")}</span>
        <h1>{t("Este panel es para personal municipal")}</h1>
        <p>
          {t(
            "Los ciudadanos pueden crear y consultar sus reportes desde la aplicación móvil. Si eres funcionario, empresa o administrador, usa tus credenciales institucionales."
          )}
        </p>
        <Link className="button button-primary" to="/login">
          {t("Volver al acceso")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="standalone-state-page">
      <div className="standalone-state-card">
        <span className="eyebrow">{t("Error 404")}</span>
        <h1>{t("No encontramos esta página")}</h1>
        <p>{t("La dirección que buscas no existe o cambió de lugar.")}</p>
        <Link className="button button-primary" to="/dashboard">
          {t("Volver al dashboard")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
