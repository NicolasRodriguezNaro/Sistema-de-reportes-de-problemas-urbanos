import { ChevronLeft, ChevronRight } from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";

export function Pagination({
  pagina,
  totalPaginas,
  total,
  onChange,
  etiqueta = "reportes",
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  onChange: (pagina: number) => void;
  etiqueta?: string;
}) {
  const { t } = useLanguage();

  if (totalPaginas <= 1) {
    return (
      <div className="pagination">
        <span className="pagination-info">{total} {t(etiqueta)}</span>
      </div>
    );
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total} {t(etiqueta)} · {t("Página {pagina} de {total}", { pagina: pagina + 1, total: totalPaginas })}
      </span>
      <div className="pagination-actions">
        <button
          className="icon-button"
          onClick={() => onChange(pagina - 1)}
          disabled={pagina <= 0}
          aria-label={t("Página anterior")}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="icon-button"
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas - 1}
          aria-label={t("Página siguiente")}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
