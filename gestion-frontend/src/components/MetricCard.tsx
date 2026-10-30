import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "warning" | "danger" | "success" | "info";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      {hint && <span className="metric-hint">{hint}</span>}
    </article>
  );
}
