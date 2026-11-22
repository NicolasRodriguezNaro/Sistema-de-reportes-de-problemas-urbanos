import { useLanguage } from "../i18n/LanguageContext";
import type { EstadoReporte, PrioridadCalculada } from "../types/api";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../utils/format";

export function StatusBadge({ estado }: { estado: EstadoReporte }) {
  const { t } = useLanguage();
  return (
    <span className={`badge badge-estado badge-${estado.toLowerCase()}`}>
      <span className="badge-dot" />
      {t(ETIQUETAS_ESTADO[estado])}
    </span>
  );
}

export function PriorityBadge({ prioridad }: { prioridad: PrioridadCalculada | null }) {
  const { t } = useLanguage();
  if (!prioridad) {
    return <span className="badge badge-prioridad badge-sin">{t("Sin calcular")}</span>;
  }
  return (
    <span className={`badge badge-prioridad badge-${prioridad.toLowerCase()}`}>
      {t(ETIQUETAS_PRIORIDAD[prioridad])}
    </span>
  );
}
