import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  History,
  ImageOff,
  MapPin,
  Tag,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MapPanel, ReportMap } from "../components/MapPanel";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/States";
import { useLanguage } from "../i18n/LanguageContext";
import type {
  AsignacionReporte,
  EntidadResumen,
  EstadoReporte,
  FeatureCollection,
  HistorialReporte,
  MotivoRechazo,
  ReporteGeoProperties,
  ReporteResponse,
  TipoIncidencia,
} from "../types/api";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO,
  ETIQUETAS_MOTIVO_RECHAZO,
  ETIQUETAS_SEVERIDAD,
  formatearFechaHora,
} from "../utils/format";
import { estadoSugerido, estadosPermitidos } from "../utils/estados";

function ImagenReporte({ src, alt }: { src: string | null; alt: string }) {
  const { t } = useLanguage();
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="detail-image detail-image-empty">
        <ImageOff size={32} />
        <span>{t("Imagen no disponible")}</span>
      </div>
    );
  }
  return <img className="detail-image" src={src} alt={t(alt)} onError={() => setError(true)} />;
}

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { usuario, esAdministrador } = useAuth();
  const { t, locale } = useLanguage();
  const [reporte, setReporte] = useState<ReporteResponse | null>(null);
  const [entidades, setEntidades] = useState<EntidadResumen[]>([]);
  const [geoReporte, setGeoReporte] = useState<FeatureCollection<ReporteGeoProperties> | null>(null);
  const [historial, setHistorial] = useState<HistorialReporte[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionReporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoReporte>("PENDIENTE");
  const [motivoRechazo, setMotivoRechazo] = useState<MotivoRechazo | "">("");
  const [detalleRechazo, setDetalleRechazo] = useState("");
  const [motivoReapertura, setMotivoReapertura] = useState("");
  const [confirmarReapertura, setConfirmarReapertura] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState("");
  const [motivoAsignacion, setMotivoAsignacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const puedeGestionar =
    usuario?.rol === "FUNCIONARIO" ||
    usuario?.rol === "EMPRESA" ||
    usuario?.rol === "ADMINISTRADOR";
  const puedeAsignar = esAdministrador;

  const cargar = useCallback(async () => {
    if (!id) return;
    setCargando(true);
    setError(null);
    try {
      const [data, historialData, asignacionesData] = await Promise.all([
        apiFetch<ReporteResponse>(`/api/reportes/${id}`),
        apiFetch<HistorialReporte[]>(`/api/reportes/${id}/historial`).catch(() => []),
        esAdministrador
          ? apiFetch<AsignacionReporte[]>(`/api/reportes/${id}/asignaciones`).catch(() => [])
          : Promise.resolve([] as AsignacionReporte[]),
      ]);
      setReporte(data);
      setHistorial(historialData);
      setAsignaciones(asignacionesData);
      setNuevoEstado(
        estadoSugerido(data.estado, esAdministrador, Boolean(data.entidadAsignadaId))
      );
      setMotivoRechazo(data.motivoRechazo ?? "");
      setDetalleRechazo(data.detalleRechazo ?? "");
      setMotivoReapertura("");
      setMotivoAsignacion("");
      setConfirmarReapertura(false);
      setEntidadSeleccionada(data.entidadAsignadaId ? String(data.entidadAsignadaId) : "");
      const geo = await apiFetch<FeatureCollection<ReporteGeoProperties>>("/api/reportes/geojson");
      setGeoReporte({
        type: "FeatureCollection",
        features: geo.features.filter((feature) => feature.properties.id === data.id),
      });
      if (esAdministrador) {
        const entidadesData = await apiFetch<EntidadResumen[]>("/api/entidades");
        setEntidades(entidadesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [esAdministrador, id]);

  useEffect(() => {
    void cargar();
  }, [cargar, version]);

  const entidadNombres = useMemo(
    () => new Map(entidades.map((entidad) => [entidad.id, entidad.nombre])),
    [entidades]
  );

  const rechazoIncompleto =
    nuevoEstado === "RECHAZADO" &&
    (!motivoRechazo || (motivoRechazo === "OTRO" && !detalleRechazo.trim()));

  const cambiarEstado = async () => {
    if (!reporte) return;
    if (rechazoIncompleto) {
      setMensaje(null);
      setErrorAccion(
        motivoRechazo === "OTRO"
          ? "Explica el motivo del rechazo."
          : "Selecciona un motivo de rechazo."
      );
      return;
    }
    setGuardando(true);
    setMensaje(null);
    setErrorAccion(null);
    try {
      const actualizado = await apiFetch<ReporteResponse>(`/api/reportes/${reporte.id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({
          estado: nuevoEstado,
          motivoRechazo: nuevoEstado === "RECHAZADO" ? motivoRechazo : null,
          detalleRechazo:
            nuevoEstado === "RECHAZADO" ? detalleRechazo.trim() || null : null,
        }),
      });
      setReporte(actualizado);
      setNuevoEstado(
        estadoSugerido(actualizado.estado, esAdministrador, Boolean(actualizado.entidadAsignadaId))
      );
      setMotivoRechazo(actualizado.motivoRechazo ?? "");
      setDetalleRechazo(actualizado.detalleRechazo ?? "");
      const historialActualizado = await apiFetch<HistorialReporte[]>(
        `/api/reportes/${reporte.id}/historial`
      ).catch(() => historial);
      setHistorial(historialActualizado);
      setMensaje("Estado actualizado correctamente.");
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setGuardando(false);
    }
  };

  const solicitarReapertura = () => {
    if (!motivoReapertura.trim()) {
      setMensaje(null);
      setErrorAccion("Escribe el motivo de reapertura.");
      return;
    }
    setErrorAccion(null);
    setConfirmarReapertura(true);
  };

  const reabrirReporte = async () => {
    if (!reporte) return;

    setGuardando(true);
    setMensaje(null);
    setErrorAccion(null);
    try {
      const actualizado = await apiFetch<ReporteResponse>(`/api/reportes/${reporte.id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({
          estado: "EN_REVISION",
          motivoReapertura: motivoReapertura.trim(),
        }),
      });
      setReporte(actualizado);
      setNuevoEstado(
        estadoSugerido(actualizado.estado, esAdministrador, Boolean(actualizado.entidadAsignadaId))
      );
      setMotivoRechazo("");
      setDetalleRechazo("");
      setMotivoReapertura("");
      setConfirmarReapertura(false);
      const historialActualizado = await apiFetch<HistorialReporte[]>(
        `/api/reportes/${reporte.id}/historial`
      ).catch(() => historial);
      setHistorial(historialActualizado);
      setMensaje("Reporte reabierto y enviado a revisión.");
    } catch (err) {
      setConfirmarReapertura(false);
      setErrorAccion(err instanceof Error ? err.message : "No se pudo reabrir el reporte.");
    } finally {
      setGuardando(false);
    }
  };

  const asignarEntidad = async () => {
    if (!reporte || !entidadSeleccionada) return;
    setGuardando(true);
    setMensaje(null);
    setErrorAccion(null);
    try {
      const actualizado = await apiFetch<ReporteResponse>(`/api/reportes/${reporte.id}/asignacion`, {
        method: "PATCH",
        body: JSON.stringify({
          entidadId: Number(entidadSeleccionada),
          motivo: motivoAsignacion.trim() || null,
        }),
      });
      setReporte(actualizado);
      setNuevoEstado(
        estadoSugerido(actualizado.estado, esAdministrador, Boolean(actualizado.entidadAsignadaId))
      );
      setMotivoAsignacion("");
      const asignacionesActualizadas = await apiFetch<AsignacionReporte[]>(
        `/api/reportes/${reporte.id}/asignaciones`
      ).catch(() => asignaciones);
      setAsignaciones(asignacionesActualizadas);
      setMensaje("Entidad asignada correctamente.");
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo asignar la entidad.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <LoadingState label={t("Cargando reporte...")} />;
  if (error || !reporte) {
    return (
      <ErrorState
        mensaje={t(error ?? "Reporte no encontrado.")}
        onRetry={() => setVersion((valor) => valor + 1)}
      />
    );
  }

  const categoria = reporte.categoriaIa
    ? t(ETIQUETAS_CATEGORIA[reporte.categoriaIa as TipoIncidencia])
    : t("Sin clasificar");
  const estadosSiguientes = estadosPermitidos(
    reporte.estado,
    esAdministrador,
    Boolean(reporte.entidadAsignadaId)
  );
  const puedeReabrir =
    reporte.estado === "RECHAZADO" || (reporte.estado === "RESUELTO" && esAdministrador);
  const puedeCambiarEntidad =
    esAdministrador && reporte.estado !== "RECHAZADO" && reporte.estado !== "RESUELTO";

  return (
    <div className="page-stack">
      <Link className="back-link" to="/reportes">
        <ArrowLeft size={16} />
        {t("Volver a reportes")}
      </Link>

      <PageHeader
        eyebrow={t("Reporte #{id}", { id: reporte.id })}
        titulo={categoria}
        descripcion={t("Detalle de la incidencia reportada por la ciudadanía.")}
        actions={
          <div className="detail-header-badges">
            <StatusBadge estado={reporte.estado} />
            <PriorityBadge prioridad={reporte.prioridadCalculada} />
          </div>
        }
      />

      {(mensaje || errorAccion) && (
        <div className={`form-feedback ${errorAccion ? "form-feedback-error" : "form-feedback-success"}`}>
          {t(errorAccion ?? mensaje ?? "")}
        </div>
      )}

      {reporte.estado === "RECHAZADO" && (
        <div className="rejection-banner">
          <Ban size={22} />
          <div>
            <strong>
              {t("Reporte rechazado")}
              {reporte.motivoRechazo
                ? `: ${t(ETIQUETAS_MOTIVO_RECHAZO[reporte.motivoRechazo])}`
                : ""}
            </strong>
            <p>
              {reporte.detalleRechazo ||
                t("No se registró una explicación adicional para este rechazo.")}
            </p>
          </div>
        </div>
      )}

      <section className="detail-grid">
        <div className="detail-main">
          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{t("Registro visual")}</span>
                <h2>{t("Evidencia del reporte")}</h2>
              </div>
              <span className="panel-meta">{formatearFechaHora(reporte.fechaCreacion, locale)}</span>
            </div>
            <ImagenReporte
              src={reporte.urlImagenHd || reporte.urlImagenThumb}
              alt={`Reporte ${reporte.id}`}
            />
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{t("Ubicación")}</span>
                <h2>{t("Punto reportado")}</h2>
              </div>
              <span className="coordinate-pill">
                <MapPin size={14} />
                {reporte.latitud.toFixed(5)}, {reporte.longitud.toFixed(5)}
              </span>
            </div>
            <ReportMap latitud={reporte.latitud} longitud={reporte.longitud} altura="300px" />
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{t("Descripción")}</span>
                <h2>{t("Lo que reportó el ciudadano")}</h2>
              </div>
            </div>
            <p className="detail-description">
              {reporte.descripcion || t("El reporte no incluye una descripción adicional.")}
            </p>
          </article>
        </div>

        <aside className="detail-side">
          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{t("Ficha")}</span>
                <h2>{t("Información del reporte")}</h2>
              </div>
            </div>
            <div className="metadata-list">
              <div>
                <span><Tag size={15} /> {t("Categoría")}</span>
                <strong>{categoria}</strong>
              </div>
              <div>
                <span><AlertTriangleIcon /> {t("Severidad")}</span>
                <strong>{reporte.severidadIa ? t(ETIQUETAS_SEVERIDAD[reporte.severidadIa]) : t("Sin calcular")}</strong>
              </div>
              <div>
                <span><CheckCircle2 size={15} /> {t("Confianza IA")}</span>
                <strong>{reporte.confianzaIa ? `${Math.round(reporte.confianzaIa * 100)}%` : t("No disponible")}</strong>
              </div>
              <div>
                <span><MapPin size={15} /> {t("Barrio")}</span>
                <strong>
                  {reporte.barrioNombre ??
                    (reporte.barrioId ? `${t("Barrio")} ${reporte.barrioId}` : t("Sin asignar"))}
                </strong>
              </div>
              <div>
                <span><Building2 size={15} /> {t("Entidad")}</span>
                <strong>
                  {reporte.entidadNombre ??
                    (reporte.entidadAsignadaId
                      ? entidadNombres.get(reporte.entidadAsignadaId) ??
                        `${t("Entidad")} ${reporte.entidadAsignadaId}`
                      : t("Sin asignar"))}
                </strong>
              </div>
              <div>
                <span><UserRound size={15} /> {t("Reportado por")}</span>
                <strong>{t("Usuario #{id}", { id: reporte.usuarioId })}</strong>
              </div>
              <div>
                <span><CalendarDays size={15} /> {t("Actualizado")}</span>
                <strong>{formatearFechaHora(reporte.fechaActualizacion, locale)}</strong>
              </div>
              {reporte.reportePadreId && (
                <div>
                  <span><ChevronRight size={15} /> {t("Reporte padre")}</span>
                  <strong>#{reporte.reportePadreId}</strong>
                </div>
              )}
            </div>
          </article>

          <article className="panel action-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{t("Gestión")}</span>
                <h2>{t("Acciones disponibles")}</h2>
              </div>
            </div>

            {puedeGestionar ? (
              puedeReabrir ? (
                <div className="action-block">
                  <p className="read-only-note">
                    {t(
                      reporte.estado === "RECHAZADO"
                        ? "Este reporte está rechazado. Para corregir la decisión, reábrelo y explica el motivo."
                        : "Este reporte está resuelto. Como administrador puedes reabrirlo explicando el motivo."
                    )}
                    {" "}{t("Volverá al estado En revisión.")}
                  </p>
                  <label className="field">
                    <span>{t("Motivo de reapertura")}</span>
                    <textarea
                      value={motivoReapertura}
                      maxLength={1000}
                      rows={3}
                      placeholder={t("Explica por qué se reabre este reporte.")}
                      onChange={(event) => setMotivoReapertura(event.target.value)}
                    />
                  </label>
                  <button
                    className="button button-primary button-block"
                    onClick={solicitarReapertura}
                    disabled={guardando || !motivoReapertura.trim()}
                  >
                    {guardando ? t("Reabriendo...") : t("Reabrir reporte")}
                  </button>
                </div>
              ) : estadosSiguientes.length > 0 ? (
                <div className="action-block">
                  <label className="field">
                    <span>{t("Cambiar estado")}</span>
                    <select
                      value={nuevoEstado}
                      onChange={(event) => {
                        const estado = event.target.value as EstadoReporte;
                        setNuevoEstado(estado);
                        if (estado !== "RECHAZADO") {
                          setMotivoRechazo("");
                          setDetalleRechazo("");
                        }
                      }}
                    >
                      {estadosSiguientes.map((estado) => (
                        <option key={estado} value={estado}>{t(ETIQUETAS_ESTADO[estado])}</option>
                      ))}
                    </select>
                  </label>
                  {nuevoEstado === "RECHAZADO" && (
                    <>
                      <label className="field">
                        <span>{t("Motivo de rechazo")}</span>
                        <select
                          value={motivoRechazo}
                          onChange={(event) =>
                            setMotivoRechazo(event.target.value as MotivoRechazo | "")
                          }
                        >
                          <option value="">{t("Selecciona un motivo")}</option>
                          {Object.entries(ETIQUETAS_MOTIVO_RECHAZO).map(([valor, label]) => (
                            <option key={valor} value={valor}>{t(label)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>
                          {t("Detalle")}{" "}
                          {motivoRechazo === "OTRO" ? t("(obligatorio)") : t("(opcional)")}
                        </span>
                        <textarea
                          value={detalleRechazo}
                          maxLength={1000}
                          rows={3}
                          placeholder={t("Explica brevemente la decisión para el ciudadano.")}
                          onChange={(event) => setDetalleRechazo(event.target.value)}
                        />
                      </label>
                    </>
                  )}
                  <button
                    className="button button-primary button-block"
                    onClick={cambiarEstado}
                    disabled={guardando || nuevoEstado === reporte.estado || rechazoIncompleto}
                  >
                    {guardando ? t("Guardando...") : t("Guardar estado")}
                  </button>
                </div>
              ) : (
                <p className="read-only-note">
                  {t("Este reporte está resuelto. Solo un administrador puede reabrirlo.")}
                </p>
              )
            ) : (
              <p className="read-only-note">{t("Tu rol puede consultar este reporte, pero no cambiar su estado.")}</p>
            )}

            {puedeAsignar && puedeCambiarEntidad && (
              <div className="action-block action-block-separated">
                <label className="field">
                  <span>{t("Entidad responsable")}</span>
                  <select
                    value={entidadSeleccionada}
                    onChange={(event) => setEntidadSeleccionada(event.target.value)}
                  >
                    <option value="">{t("Selecciona una entidad")}</option>
                    {entidades.map((entidad) => (
                      <option key={entidad.id} value={entidad.id}>{entidad.nombre}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{t("Motivo del cambio (opcional)")}</span>
                  <textarea
                    value={motivoAsignacion}
                    maxLength={500}
                    rows={2}
                    placeholder={t("Explica por qué se cambia la entidad responsable.")}
                    onChange={(event) => setMotivoAsignacion(event.target.value)}
                  />
                </label>
                <button
                  className="button button-secondary button-block"
                  onClick={asignarEntidad}
                  disabled={guardando || !entidadSeleccionada || Number(entidadSeleccionada) === reporte.entidadAsignadaId}
                >
                  {t("Asignar entidad")}
                </button>
              </div>
            )}

            {puedeAsignar && !puedeCambiarEntidad && (
              <div className="action-block action-block-separated">
                <p className="read-only-note">
                  {t("La entidad responsable no se puede cambiar mientras el reporte esté {estado}. Reábrelo primero para volver a asignarlo.", {
                    estado: t(ETIQUETAS_ESTADO[reporte.estado]).toLowerCase(),
                  })}
                </p>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">{t("Trazabilidad")}</span>
                <h2>{t("Historial de estados")}</h2>
              </div>
              <History size={18} />
            </div>
            {historial.length > 0 ? (
              <ol className="history-list">
                {historial.map((evento) => (
                  <li className="history-item" key={evento.id}>
                    <span className={`history-dot history-dot-${evento.estadoNuevo.toLowerCase()}`} />
                    <div className="history-content">
                      <div className="history-heading">
                        <strong>
                          {evento.estadoAnterior
                            ? `${t(ETIQUETAS_ESTADO[evento.estadoAnterior])} → ${t(ETIQUETAS_ESTADO[evento.estadoNuevo])}`
                            : t(ETIQUETAS_ESTADO[evento.estadoNuevo])}
                        </strong>
                        <span>{formatearFechaHora(evento.fecha, locale)}</span>
                      </div>
                      <span className="history-actor">{t("por {nombre}", { nombre: evento.usuarioNombre })}</span>
                      {evento.motivo && (
                        <span className="history-reason">
                          {t(ETIQUETAS_MOTIVO_RECHAZO[evento.motivo])}
                          {evento.detalle ? ` · ${evento.detalle}` : ""}
                        </span>
                      )}
                      {evento.motivoReapertura && (
                        <span className="history-reopen">
                          {t("Motivo de reapertura: {motivo}", { motivo: evento.motivoReapertura })}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="read-only-note">
                {t("Este reporte no tiene movimientos de estado registrados.")}
              </p>
            )}
          </article>

          {esAdministrador && (
            <article className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">{t("Trazabilidad")}</span>
                  <h2>{t("Historial de asignaciones")}</h2>
                </div>
                <Building2 size={18} />
              </div>
              {asignaciones.length > 0 ? (
              <ol className="history-list">
                {asignaciones.map((asignacion) => (
                  <li className="history-item" key={asignacion.id}>
                    <span
                      className={`history-dot ${
                        asignacion.origen === "JENA" ? "history-dot-jena" : "history-dot-admin"
                      }`}
                    />
                    <div className="history-content">
                      <div className="history-heading">
                        <strong>
                          {t(asignacion.origen === "JENA"
                            ? "Asignación automática"
                            : "Reasignación manual")}
                        </strong>
                        <span>{formatearFechaHora(asignacion.fecha, locale)}</span>
                      </div>
                      <span className="history-actor">
                        {t("por {nombre}", {
                          nombre: asignacion.usuarioNombre ?? t("Sistema (Jena)"),
                        })}
                      </span>
                      <span className="history-assignment">
                        {asignacion.entidadAnteriorNombre ?? t("Sin entidad")} →{" "}
                        {asignacion.entidadNuevaNombre}
                      </span>
                      {asignacion.motivo && (
                        <span className="history-assignment-motive">
                          {t("Motivo: {motivo}", { motivo: asignacion.motivo })}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="read-only-note">
                {t("Este reporte no tiene cambios de entidad registrados.")}
              </p>
            )}
            </article>
          )}

          {geoReporte && geoReporte.features.length > 0 && (
            <article className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">{t("Contexto")}</span>
                  <h2>{t("Vista territorial")}</h2>
                </div>
              </div>
              <MapPanel reportes={geoReporte} altura="190px" zoomControl={false} />
            </article>
          )}
        </aside>
      </section>

      <ConfirmDialog
        abierto={confirmarReapertura}
        titulo={t("Reabrir reporte #{id}", { id: reporte.id })}
        descripcion={t(
          reporte.estado === "RECHAZADO"
            ? "El reporte volverá a En revisión. El rechazo anterior se conservará en el historial."
            : "El reporte volverá a En revisión. El cierre anterior se conservará en el historial."
        )}
        detalle={
          <>
            <span>{t("Motivo de reapertura:")} </span>
            <strong>{motivoReapertura}</strong>
          </>
        }
        confirmarLabel={t("Reabrir reporte")}
        cargando={guardando}
        onConfirmar={reabrirReporte}
        onCancelar={() => setConfirmarReapertura(false)}
      />
    </div>
  );
}

function AlertTriangleIcon() {
  return <span className="metadata-icon">!</span>;
}
