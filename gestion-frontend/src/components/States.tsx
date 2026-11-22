import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { useLanguage } from "../i18n/LanguageContext";

export function LoadingState({ label = "Cargando información..." }: { label?: string }) {
  const { t } = useLanguage();
  return (
    <div className="state-panel">
      <LoaderCircle className="spin" size={26} />
      <p>{t(label)}</p>
    </div>
  );
}

export function EmptyState({
  titulo,
  descripcion,
  accion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  icono?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="state-panel state-panel-empty">
      <div className="state-icon">{icono ?? <Inbox size={24} />}</div>
      <h3>{t(titulo)}</h3>
      <p>{t(descripcion)}</p>
      {accion}
    </div>
  );
}

export function ErrorState({
  mensaje,
  onRetry,
}: {
  mensaje: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="state-panel state-panel-error">
      <div className="state-icon">
        <AlertTriangle size={24} />
      </div>
      <h3>{t("No se pudo cargar la información")}</h3>
      <p>{t(mensaje)}</p>
      {onRetry && (
        <button className="button button-secondary" onClick={onRetry}>
          <RefreshCw size={16} />
          {t("Reintentar")}
        </button>
      )}
    </div>
  );
}
