import type { EstadoReporte, PrioridadCalculada } from "../types/api";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../utils/format";

export function StatusBadge({ estado }: { estado: EstadoReporte }) {
  return (
    <span className={`badge badge-estado badge-${estado.toLowerCase()}`}>
      <span className="badge-dot" />
      {ETIQUETAS_ESTADO[estado]}
    </span>
  );
}

export function PriorityBadge({ prioridad }: { prioridad: PrioridadCalculada | null }) {
  if (!prioridad) {
    return <span className="badge badge-prioridad badge-sin">Sin calcular</span>;
  }
  return (
    <span className={`badge badge-prioridad badge-${prioridad.toLowerCase()}`}>
      {ETIQUETAS_PRIORIDAD[prioridad]}
    </span>
  );
}
