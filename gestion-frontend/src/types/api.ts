export type RolUsuario = "CIUDADANO" | "FUNCIONARIO" | "ADMINISTRADOR" | "EMPRESA";

export type EstadoReporte = "PENDIENTE" | "EN_REVISION" | "ASIGNADO" | "RESUELTO" | "RECHAZADO";

export type TipoIncidencia = "HUECO_VIA" | "FUGA_AGUA" | "FALLA_ALUMBRADO" | "ACUMULACION_BASURA";

export type Severidad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export type PrioridadCalculada = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export type MotivoRechazo =
  | "NO_RELACIONADO"
  | "INFORMACION_INSUFICIENTE"
  | "IMAGEN_ILEGIBLE"
  | "UBICACION_INCORRECTA"
  | "DUPLICADO"
  | "SPAM"
  | "OTRO";

export type OrigenAsignacion = "JENA" | "ADMINISTRADOR";

export type TipoEntidad =
  | "SECRETARIA_OBRAS_PUBLICAS"
  | "EMPRESA_SERVICIOS_PUBLICOS"
  | "EMPRESA_ASEO";

export interface UsuarioResumen {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  entidadId: number | null;
  entidadNombre: string | null;
}

export interface TokenResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: UsuarioResumen;
}

export interface ArchivoResponse {
  clave: string;
  url: string;
  claveThumb: string | null;
  urlThumb: string | null;
}

export interface ReporteResumen {
  id: number;
  estado: EstadoReporte;
  categoriaIa: TipoIncidencia | null;
  severidadIa: Severidad | null;
  prioridadCalculada: PrioridadCalculada | null;
  descripcion: string | null;
  claveImagenThumb: string | null;
  urlImagenThumb: string | null;
  barrioId: number | null;
  barrioNombre: string | null;
  entidadAsignadaId: number | null;
  entidadNombre: string | null;
  usuarioId: number;
  reportePadreId: number | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ReporteResponse extends ReporteResumen {
  confianzaIa: number | null;
  latitud: number;
  longitud: number;
  claveImagenHd: string;
  urlImagenHd: string | null;
  motivoRechazo: MotivoRechazo | null;
  detalleRechazo: string | null;
}

export interface HistorialReporte {
  id: number;
  estadoAnterior: EstadoReporte | null;
  estadoNuevo: EstadoReporte;
  usuarioId: number;
  usuarioNombre: string;
  motivo: MotivoRechazo | null;
  detalle: string | null;
  motivoReapertura: string | null;
  fecha: string;
}

export interface AsignacionReporte {
  id: number;
  entidadAnteriorId: number | null;
  entidadAnteriorNombre: string | null;
  entidadNuevaId: number;
  entidadNuevaNombre: string;
  usuarioId: number | null;
  usuarioNombre: string | null;
  origen: OrigenAsignacion;
  motivo: string | null;
  fecha: string;
}

export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}

export interface ConteoBarrio {
  barrioId: number;
  nombre: string;
  total: number;
}

export interface DashboardResumen {
  total: number;
  porEstado: Record<EstadoReporte, number>;
  porCategoria: Record<TipoIncidencia, number>;
  porPrioridad: Record<PrioridadCalculada, number>;
  criticos: number;
  sinAsignar: number;
  rechazados: number;
  pendientesClasificacion: number;
  porBarrio: ConteoBarrio[];
}

export interface EntidadResumen {
  id: number;
  nombre: string;
  tipo: TipoEntidad;
  contactoEmail: string;
}

export interface UsuarioGestion {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  entidadId: number | null;
  entidadNombre: string | null;
  activo: boolean;
  fechaRegistro: string | null;
}

export interface UsuarioCreacionRequest {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  entidadId: number | null;
}

export interface UsuarioActualizacionRequest {
  nombre: string;
  rol: RolUsuario;
  entidadId: number | null;
  activo: boolean;
}

export interface FuncionarioCreacionRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface FuncionarioActualizacionRequest {
  nombre: string;
  activo: boolean;
}

export interface ErrorApi {
  error: string;
  mensaje?: string;
  campos?: Record<string, string>;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoJsonFeature<P> {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties: P;
}

export interface FeatureCollection<P> {
  type: "FeatureCollection";
  features: Array<GeoJsonFeature<P>>;
}

export interface ReporteGeoProperties {
  id: number;
  estado: EstadoReporte;
  categoria: TipoIncidencia | null;
  prioridad: PrioridadCalculada | null;
  thumbUrl: string | null;
  fechaCreacion: string;
  barrioNombre: string | null;
  entidadNombre: string | null;
}

export interface BarrioGeoProperties {
  gid: number;
  nombre: string;
  codComuna: number | null;
  codBarrio: number | null;
}

export interface SitioGeoProperties {
  gid: number;
  nombre: string;
  tipoSitio: string;
  radioInfluencia: number;
  critico: boolean;
}
