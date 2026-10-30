export type RolUsuario = "CIUDADANO" | "FUNCIONARIO" | "ADMINISTRADOR" | "EMPRESA";

export type EstadoReporte = "PENDIENTE" | "EN_REVISION" | "ASIGNADO" | "RESUELTO" | "RECHAZADO";

export type TipoIncidencia = "HUECO_VIA" | "FUGA_AGUA" | "FALLA_ALUMBRADO" | "ACUMULACION_BASURA";

export type Severidad = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export type PrioridadCalculada = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

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

export interface ReporteDetalle extends ReporteResumen {
  confianzaIa: number | null;
  latitud: number;
  longitud: number;
  claveImagenHd: string;
  urlImagenHd: string | null;
}

export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}

export interface ErrorApi {
  error: string;
  mensaje?: string;
  campos?: Record<string, string>;
}

export const ETIQUETAS_ESTADO: Record<EstadoReporte, string> = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  ASIGNADO: "Asignado",
  RESUELTO: "Resuelto",
  RECHAZADO: "Rechazado",
};

export const ETIQUETAS_CATEGORIA: Record<TipoIncidencia, string> = {
  HUECO_VIA: "Hueco en la vía",
  FUGA_AGUA: "Fuga de agua",
  FALLA_ALUMBRADO: "Falla de alumbrado",
  ACUMULACION_BASURA: "Acumulación de basura",
};

export const ETIQUETAS_SEVERIDAD: Record<Severidad, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const ETIQUETAS_PRIORIDAD: Record<PrioridadCalculada, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};
