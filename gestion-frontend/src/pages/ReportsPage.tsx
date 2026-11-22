import { Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, construirQuery } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { ReportTable } from "../components/ReportTable";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useLanguage } from "../i18n/LanguageContext";
import type { EntidadResumen, PaginaResponse, ReporteResumen } from "../types/api";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO } from "../utils/format";

interface Filtros {
  texto: string;
  estado: string;
  categoria: string;
  prioridad: string;
  entidadId: string;
  desde: string;
  hasta: string;
}

const FILTROS_INICIALES: Filtros = {
  texto: "",
  estado: "",
  categoria: "",
  prioridad: "",
  entidadId: "",
  desde: "",
  hasta: "",
};

export function ReportsPage() {
  const { esAdministrador } = useAuth();
  const { t } = useLanguage();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [filtrosActivos, setFiltrosActivos] = useState<Filtros>(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(20);
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [entidades, setEntidades] = useState<EntidadResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!esAdministrador) return;
    apiFetch<EntidadResumen[]>("/api/entidades")
      .then(setEntidades)
      .catch(() => setEntidades([]));
  }, [esAdministrador]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const query = construirQuery({
        texto: filtrosActivos.texto,
        estado: filtrosActivos.estado,
        categoria: filtrosActivos.categoria,
        prioridad: filtrosActivos.prioridad,
        entidadId: filtrosActivos.entidadId,
        desde: filtrosActivos.desde,
        hasta: filtrosActivos.hasta,
        page: pagina,
        size: tamano,
      });
      const data = await apiFetch<PaginaResponse<ReporteResumen>>(`/api/reportes${query}`);
      setReportes(data.contenido);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [filtrosActivos, pagina, tamano]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const entidadNombres = useMemo(
    () => new Map(entidades.map((entidad) => [entidad.id, entidad.nombre])),
    [entidades]
  );

  const aplicar = () => {
    setPagina(0);
    setFiltrosActivos({ ...filtros });
  };

  const limpiar = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosActivos(FILTROS_INICIALES);
    setPagina(0);
  };

  const hayFiltros = Object.values(filtrosActivos).some(Boolean);

  const cambiar = (campo: keyof Filtros, valor: string) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("Bandeja de trabajo")}
        titulo={t("Reportes ciudadanos")}
        descripcion={t("Encuentra, filtra y da seguimiento a las incidencias reportadas.")}
        actions={
          <button className="button button-secondary" onClick={limpiar} disabled={!hayFiltros}>
            <RotateCcw size={16} />
            {t("Limpiar filtros")}
          </button>
        }
      />

      <section className="filters-panel">
        <div className="filters-heading">
          <div>
            <SlidersHorizontal size={18} />
            <strong>{t("Filtros")}</strong>
          </div>
          <span>{t(hayFiltros ? "Filtros activos" : "Sin filtros aplicados")}</span>
        </div>

        <div className="filters-grid">
          <label className="field field-search">
            <span>{t("Buscar")}</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                placeholder={t("Buscar reporte")}
                value={filtros.texto}
                onChange={(event) => cambiar("texto", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") aplicar();
                }}
              />
            </div>
          </label>

          <label className="field">
            <span>{t("Estado")}</span>
            <select value={filtros.estado} onChange={(event) => cambiar("estado", event.target.value)}>
              <option value="">{t("Todos")}</option>
              {Object.entries(ETIQUETAS_ESTADO).map(([valor, label]) => (
                <option key={valor} value={valor}>{t(label)}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("Categoría")}</span>
            <select value={filtros.categoria} onChange={(event) => cambiar("categoria", event.target.value)}>
              <option value="">{t("Todas")}</option>
              {Object.entries(ETIQUETAS_CATEGORIA).map(([valor, label]) => (
                <option key={valor} value={valor}>{t(label)}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("Prioridad")}</span>
            <select value={filtros.prioridad} onChange={(event) => cambiar("prioridad", event.target.value)}>
              <option value="">{t("Todas")}</option>
              <option value="BAJA">{t("Baja")}</option>
              <option value="MEDIA">{t("Media")}</option>
              <option value="ALTA">{t("Alta")}</option>
              <option value="CRITICA">{t("Crítica")}</option>
            </select>
          </label>

          {esAdministrador && (
            <label className="field">
              <span>{t("Entidad")}</span>
              <select value={filtros.entidadId} onChange={(event) => cambiar("entidadId", event.target.value)}>
                <option value="">{t("Todas")}</option>
                {entidades.map((entidad) => (
                  <option key={entidad.id} value={entidad.id}>{entidad.nombre}</option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>{t("Desde")}</span>
            <input type="date" value={filtros.desde} onChange={(event) => cambiar("desde", event.target.value)} />
          </label>

          <label className="field">
            <span>{t("Hasta")}</span>
            <input type="date" value={filtros.hasta} onChange={(event) => cambiar("hasta", event.target.value)} />
          </label>

          <button className="button button-primary filter-submit" onClick={aplicar}>
            <Filter size={16} />
            {t("Aplicar filtros")}
          </button>
        </div>
      </section>

      <section className="panel reports-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("Resultados")}</span>
            <h2>
              {total > 0
                ? t("{n} reportes encontrados", { n: total })
                : t("Sin resultados")}
            </h2>
          </div>
          <label className="page-size">
            <span>{t("Filas")}</span>
            <select
              value={tamano}
              onChange={(event) => {
                setTamano(Number(event.target.value));
                setPagina(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        {cargando ? (
          <LoadingState label={t("Consultando reportes...")} />
        ) : error ? (
          <ErrorState mensaje={t(error)} onRetry={() => void cargar()} />
        ) : reportes.length === 0 ? (
          <EmptyState
            titulo={t(hayFiltros ? "No encontramos coincidencias" : "Aún no hay reportes")}
            descripcion={t(
              hayFiltros
                ? "Prueba con otros filtros o limpia la búsqueda."
                : "Cuando los ciudadanos empiecen a reportar incidencias, aparecerán aquí."
            )}
            accion={
              hayFiltros ? (
                <button className="button button-secondary" onClick={limpiar}>
                  {t("Limpiar filtros")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ReportTable reportes={reportes} entidadNombres={entidadNombres} />
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={total}
              onChange={setPagina}
            />
          </>
        )}
      </section>
    </div>
  );
}
