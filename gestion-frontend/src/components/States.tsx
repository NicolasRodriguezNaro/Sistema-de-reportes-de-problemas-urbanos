import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Cargando información..." }: { label?: string }) {
  return (
    <div className="state-panel">
      <LoaderCircle className="spin" size={26} />
      <p>{label}</p>
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
  return (
    <div className="state-panel state-panel-empty">
      <div className="state-icon">{icono ?? <Inbox size={24} />}</div>
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
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
  return (
    <div className="state-panel state-panel-error">
      <div className="state-icon">
        <AlertTriangle size={24} />
      </div>
      <h3>No se pudo cargar la información</h3>
      <p>{mensaje}</p>
      {onRetry && (
        <button className="button button-secondary" onClick={onRetry}>
          <RefreshCw size={16} />
          Reintentar
        </button>
      )}
    </div>
  );
}
