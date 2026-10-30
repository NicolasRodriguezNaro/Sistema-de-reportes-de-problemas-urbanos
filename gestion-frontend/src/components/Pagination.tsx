import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  pagina,
  totalPaginas,
  total,
  onChange,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  onChange: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) {
    return (
      <div className="pagination">
        <span className="pagination-info">{total} reportes</span>
      </div>
    );
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total} reportes · página {pagina + 1} de {totalPaginas}
      </span>
      <div className="pagination-actions">
        <button
          className="icon-button"
          onClick={() => onChange(pagina - 1)}
          disabled={pagina <= 0}
          aria-label="Página anterior"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="icon-button"
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas - 1}
          aria-label="Página siguiente"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
