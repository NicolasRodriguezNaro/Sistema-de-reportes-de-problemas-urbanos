import type { ReactNode } from "react";

import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span>{t(label)}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      {hint && <span className="metric-hint">{t(hint)}</span>}
    </article>
  );
}
