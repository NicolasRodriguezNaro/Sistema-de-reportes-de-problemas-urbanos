import { ImageOff, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext";
import type { ReporteResumen } from "../types/api";
import { ETIQUETAS_CATEGORIA, formatearFecha } from "../utils/format";
import { PriorityBadge, StatusBadge } from "./Badges";

function ReportThumb({ src, alt }: { src: string | null; alt: string }) {
  const { t } = useLanguage();
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="report-thumb report-thumb-empty" aria-label={t("Imagen no disponible")}>
        <ImageOff size={18} />
      </div>
    );
  }

  return <img className="report-thumb" src={src} alt={t(alt)} onError={() => setError(true)} />;
}

function Ubicacion({ barrioId, barrioNombre }: { barrioId: number | null; barrioNombre: string | null }) {
  const { t } = useLanguage();
  return (
    <span className="report-location">
      <MapPin size={14} />
      {barrioNombre ?? (barrioId ? `${t("Barrio")} ${barrioId}` : t("Sin barrio"))}
    </span>
  );
}

export function ReportTable({
  reportes,
  entidadNombres,
}: {
  reportes: ReporteResumen[];
  entidadNombres?: Map<number, string>;
}) {
  const { t, locale } = useLanguage();
  return (
    <div className="reports-view">
      <div className="reports-table-wrap">
        <table className="reports-table">
          <thead>
            <tr>
              <th>{t("Reporte")}</th>
              <th>{t("Categoría")}</th>
              <th>{t("Barrio")}</th>
              <th>{t("Entidad")}</th>
              <th>{t("Estado")}</th>
              <th>{t("Prioridad")}</th>
              <th>{t("Fecha")}</th>
              <th aria-label={t("Acciones")} />
            </tr>
          </thead>
          <tbody>
            {reportes.map((reporte) => (
              <tr key={reporte.id}>
                <td>
                  <div className="report-cell">
                    <ReportThumb
                      src={reporte.urlImagenThumb}
                      alt={`Reporte ${reporte.id}`}
                    />
                    <div>
                      <Link className="report-id" to={`/reportes/${reporte.id}`}>
                        #{reporte.id}
                      </Link>
                      <span className="report-description">
                        {reporte.descripcion || t("Sin descripción")}
                      </span>
                    </div>
                  </div>
                </td>
                <td>{reporte.categoriaIa ? t(ETIQUETAS_CATEGORIA[reporte.categoriaIa]) : t("Sin clasificar")}</td>
                <td><Ubicacion barrioId={reporte.barrioId} barrioNombre={reporte.barrioNombre} /></td>
                <td>
                  {reporte.entidadNombre ??
                    (reporte.entidadAsignadaId
                      ? entidadNombres?.get(reporte.entidadAsignadaId) ??
                        `${t("Entidad")} ${reporte.entidadAsignadaId}`
                      : t("Sin asignar"))}
                </td>
                <td><StatusBadge estado={reporte.estado} /></td>
                <td><PriorityBadge prioridad={reporte.prioridadCalculada} /></td>
                <td className="report-date">{formatearFecha(reporte.fechaCreacion, locale)}</td>
                <td>
                  <Link className="table-action" to={`/reportes/${reporte.id}`}>
                    {t("Ver detalle")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="reports-card-list">
        {reportes.map((reporte) => (
          <Link className="report-card" key={reporte.id} to={`/reportes/${reporte.id}`}>
            <div className="report-card-top">
              <span className="report-id">#{reporte.id}</span>
              <StatusBadge estado={reporte.estado} />
            </div>
            <div className="report-card-body">
              <ReportThumb
                src={reporte.urlImagenThumb}
                alt={`Reporte ${reporte.id}`}
              />
              <div>
                <span className="report-card-category">
                  {reporte.categoriaIa ? t(ETIQUETAS_CATEGORIA[reporte.categoriaIa]) : t("Sin clasificar")}
                </span>
                <p>{reporte.descripcion || t("Sin descripción")}</p>
                <div className="report-card-meta">
                  <Ubicacion barrioId={reporte.barrioId} barrioNombre={reporte.barrioNombre} />
                  <PriorityBadge prioridad={reporte.prioridadCalculada} />
                </div>
              </div>
            </div>
            <div className="report-card-footer">
              <span>{formatearFecha(reporte.fechaCreacion, locale)}</span>
              <span>{t(reporte.entidadAsignadaId ? "Asignado" : "Sin asignar")}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
