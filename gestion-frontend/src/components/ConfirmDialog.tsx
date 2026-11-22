import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

import { useLanguage } from "../i18n/LanguageContext";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  detalle?: ReactNode;
  confirmarLabel?: string;
  cancelarLabel?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  detalle,
  confirmarLabel = "Confirmar",
  cancelarLabel = "Cancelar",
  cargando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  const tituloId = useId();
  const descripcionId = useId();
  const confirmarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    confirmarRef.current?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = overflowAnterior;
    };
  }, [abierto, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancelar();
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
      >
        <button
          className="modal-close"
          type="button"
          aria-label={t("Cerrar")}
          onClick={onCancelar}
          disabled={cargando}
        >
          <X size={18} />
        </button>
        <div className="modal-icon">
          <AlertTriangle size={22} />
        </div>
        <h2 id={tituloId}>{t(titulo)}</h2>
        <p id={descripcionId}>{t(descripcion)}</p>
        {detalle && <div className="modal-detail">{detalle}</div>}
        <div className="modal-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onCancelar}
            disabled={cargando}
          >
            {t(cancelarLabel)}
          </button>
          <button
            ref={confirmarRef}
            className="button button-primary"
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? t("Procesando...") : t(confirmarLabel)}
          </button>
        </div>
      </div>
    </div>
  );
}
