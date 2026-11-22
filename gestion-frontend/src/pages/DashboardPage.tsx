import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  Map as MapIcon,
  RefreshCw,
  UserRoundX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch, construirQuery } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { MapPanel } from "../components/MapPanel";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { ReportTable } from "../components/ReportTable";
import { ErrorState, LoadingState } from "../components/States";
import type {
  DashboardResumen,
  EntidadResumen,
  EstadoReporte,
  FeatureCollection,
  PaginaResponse,
  ReporteGeoProperties,
  ReporteResumen,
  TipoIncidencia,
} from "../types/api";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ENTIDAD,
  ETIQUETAS_ESTADO,
  formatearNumero,
} from "../utils/format";

const COLORES_ESTADO: Record<EstadoReporte, string> = {
  PENDIENTE: "#d97706",
  EN_REVISION: "#2563eb",
  ASIGNADO: "#7c3aed",
  RESUELTO: "#15803d",
  RECHAZADO: "#b91c1c",
};

function DonutEstado({ resumen }: { resumen: DashboardResumen }) {
  const { t, locale } = useLanguage();
  const total = resumen.total;
  let acumulado = 0;
  const segmentos = Object.entries(resumen.porEstado).map(([estado, valor]) => {
    const inicio = total > 0 ? (acumulado / total) * 360 : 0;
    acumulado += valor;
    const fin = total > 0 ? (acumulado / total) * 360 : 0;
    return `${COLORES_ESTADO[estado as EstadoReporte]} ${inicio}deg ${fin}deg`;
  });
  const fondo = total > 0 ? `conic-gradient(${segmentos.join(", ")})` : "#e2e8f0";

  return (
    <div className="donut-layout">
      <div className="donut" style={{ background: fondo }}>
        <div className="donut-hole">
          <strong>{formatearNumero(total, locale)}</strong>
          <span>{t("reportes")}</span>
        </div>
      </div>
      <div className="donut-legend">
        {Object.entries(resumen.porEstado).map(([estado, valor]) => (
          <div className="legend-row" key={estado}>
            <span className="legend-dot" style={{ background: COLORES_ESTADO[estado as EstadoReporte] }} />
            <span>{t(ETIQUETAS_ESTADO[estado as EstadoReporte])}</span>
            <strong>{formatearNumero(valor, locale)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarList({
  data,
  labels,
  color,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
  color: string;
}) {
  const { t, locale } = useLanguage();
  const entradas = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const maximo = Math.max(...entradas.map(([, valor]) => valor), 1);

  return (
    <div className="bar-list">
      {entradas.map(([clave, valor]) => (
        <div className="bar-row" key={clave}>
          <div className="bar-row-label">
            <span>{t(labels[clave] ?? clave)}</span>
            <strong>{formatearNumero(valor, locale)}</strong>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max((valor / maximo) * 100, valor > 0 ? 4 : 0)}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { esAdministrador } = useAuth();
  const { t, locale } = useLanguage();
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [entidades, setEntidades] = useState<EntidadResumen[]>([]);
  const [geoReportes, setGeoReportes] = useState<FeatureCollection<ReporteGeoProperties> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const query = construirQuery({ desde, hasta });
      const [resumenData, reportesData, entidadesData, geoData] = await Promise.all([
        apiFetch<DashboardResumen>(`/api/dashboard/resumen${query}`),
        apiFetch<PaginaResponse<ReporteResumen>>(`/api/reportes${construirQuery({ desde, hasta, size: 6 })}`),
        apiFetch<EntidadResumen[]>("/api/entidades"),
        apiFetch<FeatureCollection<ReporteGeoProperties>>(`/api/reportes/geojson${query}`),
      ]);
      setResumen(resumenData);
      setReportes(reportesData.contenido);
      setEntidades(entidadesData);
      setGeoReportes(geoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    void cargar();
  }, [cargar, version]);

  const entidadNombres = useMemo(
    () => new Map(entidades.map((entidad) => [entidad.id, entidad.nombre])),
    [entidades]
  );

  if (cargando) {
    return <LoadingState label={t("Cargando el panorama operativo...")} />;
  }

  if (error || !resumen) {
    return (
      <ErrorState
        mensaje={t(error ?? "No se recibió información del dashboard.")}
        onRetry={() => setVersion((valor) => valor + 1)}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("Panorama operativo")}
        titulo={t("Así está la ciudad hoy")}
        descripcion={t("Una lectura rápida de los reportes ciudadanos y su avance.")}
        actions={
          <>
            <div className="date-filter">
              <label>
                <span>{t("Desde")}</span>
                <input type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
              </label>
              <label>
                <span>{t("Hasta")}</span>
                <input type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
              </label>
            </div>
            <button className="button button-secondary" onClick={() => setVersion((valor) => valor + 1)}>
              <RefreshCw size={16} />
              {t("Actualizar")}
            </button>
          </>
        }
      />

      <section className="metric-grid">
        <MetricCard
          label="Total de reportes"
          value={formatearNumero(resumen.total, locale)}
          hint="En el periodo consultado"
          icon={<FileText size={18} />}
          tone="info"
        />
        <MetricCard
          label="Pendientes"
          value={formatearNumero(resumen.porEstado.PENDIENTE, locale)}
          hint="Esperando revisión"
          icon={<Clock3 size={18} />}
          tone="warning"
        />
        <MetricCard
          label="Sin clasificar"
          value={formatearNumero(resumen.pendientesClasificacion, locale)}
          hint="La IA no pudo asignar categoría"
          icon={<Inbox size={18} />}
        />
        <MetricCard
          label="Rechazados"
          value={formatearNumero(resumen.rechazados, locale)}
          hint="Fuera de la operación activa"
          icon={<Ban size={18} />}
          tone="danger"
        />
        <MetricCard
          label="En revisión"
          value={formatearNumero(resumen.porEstado.EN_REVISION, locale)}
          hint="En gestión operativa"
          icon={<RefreshCw size={18} />}
        />
        <MetricCard
          label="Críticos"
          value={formatearNumero(resumen.criticos, locale)}
          hint="Requieren atención prioritaria"
          icon={<AlertTriangle size={18} />}
          tone="danger"
        />
        <MetricCard
          label="Sin asignar"
          value={formatearNumero(resumen.sinAsignar, locale)}
          hint="Pendientes de entidad"
          icon={<UserRoundX size={18} />}
        />
        <MetricCard
          label="Resueltos"
          value={formatearNumero(resumen.porEstado.RESUELTO, locale)}
          hint="Cerrados en el periodo"
          icon={<CheckCircle2 size={18} />}
          tone="success"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel panel-span-2">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t("Distribución")}</span>
              <h2>{t("Reportes por estado")}</h2>
            </div>
            <span className="panel-meta">{t("Vista general")}</span>
          </div>
          <DonutEstado resumen={resumen} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t("Territorio")}</span>
              <h2>{t("Reportes recientes")}</h2>
            </div>
            <Link className="text-link" to="/mapa">
              {t("Abrir mapa")} <ArrowUpRight size={15} />
            </Link>
          </div>
          {geoReportes && geoReportes.features.length > 0 ? (
            <MapPanel reportes={geoReportes} altura="224px" zoomControl={false} ajustar={false} />
          ) : (
            <div className="map-empty">
              <MapIcon size={24} />
              <span>{t("No hay puntos para el periodo seleccionado.")}</span>
            </div>
          )}
        </article>

        <article className="panel panel-span-2">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t("Análisis")}</span>
              <h2>{t("Reportes por categoría")}</h2>
            </div>
          </div>
          <BarList
            data={resumen.porCategoria}
            labels={ETIQUETAS_CATEGORIA as unknown as Record<TipoIncidencia, string>}
            color="#0f4c5c"
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t("Urgencia")}</span>
              <h2>{t("Prioridad calculada")}</h2>
            </div>
          </div>
          <BarList
            data={resumen.porPrioridad}
            labels={{ BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", CRITICA: "Crítica" }}
            color="#d97706"
          />
        </article>

        <article className="panel panel-span-2">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t("Concentración")}</span>
              <h2>{t("Barrios con más reportes")}</h2>
            </div>
          </div>
          {resumen.porBarrio.length > 0 ? (
            <div className="barrio-list">
              {resumen.porBarrio.map((barrio, indice) => (
                <div className="barrio-row" key={barrio.barrioId}>
                  <span className="barrio-rank">{String(indice + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{barrio.nombre}</strong>
                    <span>{t("Barrio")} {barrio.barrioId}</span>
                  </div>
                  <span className="barrio-total">{formatearNumero(barrio.total, locale)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-inline">{t("Aún no hay reportes con barrio asignado.")}</div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">{t(esAdministrador ? "Cobertura" : "Alcance")}</span>
              <h2>{t(esAdministrador ? "Entidades" : "Mi entidad")}</h2>
            </div>
            {esAdministrador && entidades.length > 0 && (
              <span className="panel-meta">{entidades.length} {t("activas")}</span>
            )}
          </div>
          <div className="entity-mini-list">
            {entidades.map((entidad) => (
              <div className="entity-mini" key={entidad.id}>
                <div className="entity-mini-icon">{entidad.id}</div>
                <div>
                  <strong>{entidad.nombre}</strong>
                  <span>{t(ETIQUETAS_ENTIDAD[entidad.tipo])}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("Actividad")}</span>
            <h2>{t("Reportes recientes")}</h2>
          </div>
          <Link className="text-link" to="/reportes">
            {t("Ver todos")} <ArrowUpRight size={15} />
          </Link>
        </div>
        {reportes.length > 0 ? (
          <ReportTable reportes={reportes} entidadNombres={entidadNombres} />
        ) : (
          <div className="empty-inline">{t("No hay reportes en el periodo seleccionado.")}</div>
        )}
      </section>
    </div>
  );
}
