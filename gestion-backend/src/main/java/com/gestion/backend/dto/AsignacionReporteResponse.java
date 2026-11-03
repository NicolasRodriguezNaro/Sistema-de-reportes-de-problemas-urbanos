package com.gestion.backend.dto;

import java.time.Instant;

import com.gestion.backend.modelo.OrigenAsignacion;
import com.gestion.backend.modelo.ReporteAsignacionHistorial;

public record AsignacionReporteResponse(
		Long id,
		Integer entidadAnteriorId,
		String entidadAnteriorNombre,
		Integer entidadNuevaId,
		String entidadNuevaNombre,
		Long usuarioId,
		String usuarioNombre,
		OrigenAsignacion origen,
		String motivo,
		Instant fecha) {

	public static AsignacionReporteResponse desde(ReporteAsignacionHistorial asignacion) {
		return new AsignacionReporteResponse(
				asignacion.getId(),
				asignacion.getEntidadAnterior() != null ? asignacion.getEntidadAnterior().getId() : null,
				asignacion.getEntidadAnterior() != null ? asignacion.getEntidadAnterior().getNombre() : null,
				asignacion.getEntidadNueva().getId(),
				asignacion.getEntidadNueva().getNombre(),
				asignacion.getUsuario() != null ? asignacion.getUsuario().getId() : null,
				asignacion.getUsuario() != null ? asignacion.getUsuario().getNombre() : null,
				asignacion.getOrigen(),
				asignacion.getMotivo(),
				asignacion.getFecha());
	}
}
