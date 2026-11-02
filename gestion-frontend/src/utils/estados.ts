import type { EstadoReporte } from "../types/api";

const TRANSICIONES: Record<EstadoReporte, EstadoReporte[]> = {
  PENDIENTE: ["EN_REVISION", "RECHAZADO"],
  EN_REVISION: ["ASIGNADO", "PENDIENTE", "RECHAZADO"],
  ASIGNADO: ["RESUELTO", "EN_REVISION", "RECHAZADO"],
  RESUELTO: ["EN_REVISION"],
  RECHAZADO: ["EN_REVISION"],
};

export function estadosPermitidos(
  estado: EstadoReporte,
  esAdministrador: boolean,
  tieneEntidad = true
): EstadoReporte[] {
  if (estado === "RESUELTO" && !esAdministrador) {
    return [];
  }
  return TRANSICIONES[estado].filter(
    (siguiente) => siguiente !== "ASIGNADO" || tieneEntidad
  );
}

export function estadoSugerido(
  estado: EstadoReporte,
  esAdministrador: boolean,
  tieneEntidad = true
): EstadoReporte {
  return estadosPermitidos(estado, esAdministrador, tieneEntidad)[0] ?? estado;
}
