import type {
  EstadoReporte,
  MotivoRechazo,
  PrioridadCalculada,
  RolUsuario,
  Severidad,
  TipoEntidad,
  TipoIncidencia,
} from "../types/api";

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

export const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  CIUDADANO: "Ciudadano",
  FUNCIONARIO: "Funcionario",
  ADMINISTRADOR: "Administrador",
  EMPRESA: "Empresa",
};

export const ETIQUETAS_MOTIVO_RECHAZO: Record<MotivoRechazo, string> = {
  NO_RELACIONADO: "No es una incidencia urbana",
  INFORMACION_INSUFICIENTE: "Información insuficiente",
  IMAGEN_ILEGIBLE: "Imagen ilegible",
  UBICACION_INCORRECTA: "Ubicación incorrecta",
  DUPLICADO: "Reporte duplicado",
  SPAM: "Spam",
  OTRO: "Otro motivo",
};

export const ETIQUETAS_ENTIDAD: Record<TipoEntidad, string> = {
  SECRETARIA_OBRAS_PUBLICAS: "Secretaría de Obras Públicas",
  EMPRESA_SERVICIOS_PUBLICOS: "Empresa de Servicios Públicos",
  EMPRESA_ASEO: "Empresa de Aseo",
};

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fecha);
}

export function formatearFechaHora(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

export function formatearNumero(valor: number | null | undefined): string {
  return new Intl.NumberFormat("es-CO").format(valor ?? 0);
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

export function fechaParaInput(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function hace30Dias(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 30);
  return fechaParaInput(fecha);
}

export function hoy(): string {
  return fechaParaInput(new Date());
}
