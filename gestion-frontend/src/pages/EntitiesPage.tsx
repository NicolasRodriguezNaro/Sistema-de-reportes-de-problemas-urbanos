import { Building2, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/States";
import { useLanguage } from "../i18n/LanguageContext";
import type { EntidadResumen } from "../types/api";
import { ETIQUETAS_ENTIDAD } from "../utils/format";

export function EntitiesPage() {
  const { t } = useLanguage();
  const [entidades, setEntidades] = useState<EntidadResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    setCargando(true);
    setError(null);
    apiFetch<EntidadResumen[]>("/api/entidades")
      .then(setEntidades)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudieron cargar las entidades.")
      )
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) return <LoadingState label={t("Cargando entidades...")} />;
  if (error) return <ErrorState mensaje={t(error)} onRetry={cargar} />;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("Administración")}
        titulo={t("Entidades responsables")}
        descripcion={t("Catálogo institucional disponible para la asignación de reportes.")}
      />

      <section className="entities-grid">
        {entidades.map((entidad) => (
          <article className="entity-card" key={entidad.id}>
            <div className="entity-card-top">
              <div className="entity-card-icon">
                <Building2 size={22} />
              </div>
              <span className="entity-id">#{entidad.id}</span>
            </div>
            <h2>{entidad.nombre}</h2>
            <span className="entity-type">{t(ETIQUETAS_ENTIDAD[entidad.tipo])}</span>
            <a className="entity-contact" href={`mailto:${entidad.contactoEmail}`}>
              <Mail size={15} />
              {entidad.contactoEmail}
            </a>
          </article>
        ))}
      </section>

      <div className="info-note">
        <ShieldAlert size={18} />
        <p>
          {t(
            "La asignación de una entidad se realiza desde el detalle de un reporte. Esta pantalla es solo para administradores."
          )}
        </p>
      </div>
    </div>
  );
}
