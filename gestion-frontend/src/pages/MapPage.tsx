import { Layers3, MapPinned, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { apiFetch, construirQuery } from "../api/client";
import { MapPanel } from "../components/MapPanel";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/States";
import type {
  BarrioGeoProperties,
  FeatureCollection,
  ReporteGeoProperties,
  SitioGeoProperties,
} from "../types/api";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO } from "../utils/format";

export function MapPage() {
  const [reportes, setReportes] = useState<FeatureCollection<ReporteGeoProperties> | null>(null);
  const [barrios, setBarrios] = useState<FeatureCollection<BarrioGeoProperties> | null>(null);
  const [sitios, setSitios] = useState<FeatureCollection<SitioGeoProperties> | null>(null);
  const [estado, setEstado] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [mostrarBarrios, setMostrarBarrios] = useState(true);
  const [mostrarSitios, setMostrarSitios] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const query = construirQuery({ estado, categoria, prioridad });
      const [reportesData, barriosData, sitiosData] = await Promise.all([
        apiFetch<FeatureCollection<ReporteGeoProperties>>(`/api/reportes/geojson${query}`),
        apiFetch<FeatureCollection<BarrioGeoProperties>>("/api/barrios/geojson"),
        apiFetch<FeatureCollection<SitioGeoProperties>>("/api/sitios-interes/geojson"),
      ]);
      setReportes(reportesData);
      setBarrios(barriosData);
      setSitios(sitiosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [categoria, estado, prioridad]);

  useEffect(() => {
    void cargar();
  }, [cargar, version]);

  if (cargando && !reportes) return <LoadingState label="Preparando el mapa territorial..." />;
  if (error) {
    return <ErrorState mensaje={error} onRetry={() => setVersion((valor) => valor + 1)} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Lectura territorial"
        titulo="Mapa de incidencias"
        descripcion="Explora los reportes y su relación con barrios y sitios de interés."
        actions={
          <button className="button button-secondary" onClick={() => setVersion((valor) => valor + 1)}>
            <RefreshCw size={16} />
            Actualizar
          </button>
        }
      />

      <section className="map-page-grid">
        <aside className="map-side-panel">
          <div className="filters-heading">
            <div>
              <SlidersHorizontal size={18} />
              <strong>Filtros</strong>
            </div>
          </div>

          <div className="filter-stack">
            <label className="field">
              <span>Estado</span>
              <select value={estado} onChange={(event) => setEstado(event.target.value)}>
                <option value="">Todos</option>
                {Object.entries(ETIQUETAS_ESTADO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Categoría</span>
              <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
                <option value="">Todas</option>
                {Object.entries(ETIQUETAS_CATEGORIA).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Prioridad</span>
              <select value={prioridad} onChange={(event) => setPrioridad(event.target.value)}>
                <option value="">Todas</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </label>
          </div>

          <div className="layer-block">
            <div className="layer-title">
              <Layers3 size={16} />
              <span>Capas</span>
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={mostrarBarrios} onChange={(event) => setMostrarBarrios(event.target.checked)} />
              <span>Barrios</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={mostrarSitios} onChange={(event) => setMostrarSitios(event.target.checked)} />
              <span>Sitios de interés</span>
            </label>
          </div>

          <div className="map-legend">
            <div className="layer-title">
              <MapPinned size={16} />
              <span>Prioridad</span>
            </div>
            <span><i style={{ background: "#c2410c" }} /> Crítica</span>
            <span><i style={{ background: "#d97706" }} /> Alta</span>
            <span><i style={{ background: "#2563eb" }} /> Media</span>
            <span><i style={{ background: "#15803d" }} /> Baja</span>
          </div>

          <div className="map-count">
            <strong>{reportes?.features.length ?? 0}</strong>
            <span>reportes visibles</span>
          </div>
        </aside>

        <div className="map-main-panel">
          <MapPanel
            reportes={reportes ?? undefined}
            barrios={barrios ?? undefined}
            sitios={sitios ?? undefined}
            mostrarBarrios={mostrarBarrios}
            mostrarSitios={mostrarSitios}
            altura="100%"
            ajustar={false}
          />
        </div>
      </section>
    </div>
  );
}
