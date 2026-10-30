import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  titulo,
  descripcion,
  actions,
}: {
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
