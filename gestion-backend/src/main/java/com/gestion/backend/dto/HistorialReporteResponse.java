package com.gestion.backend.dto;

import java.time.Instant;

import com.gestion.backend.modelo.EstadoReporte;
import com.gestion.backend.modelo.MotivoRechazo;
import com.gestion.backend.modelo.ReporteHistorial;

public record HistorialReporteResponse(
		Long id,
		EstadoReporte estadoAnterior,
		EstadoReporte estadoNuevo,
		Long usuarioId,
		String usuarioNombre,
		MotivoRechazo motivo,
		String detalle,
		Instant fecha) {

	public static HistorialReporteResponse desde(ReporteHistorial historial) {
		return new HistorialReporteResponse(
				historial.getId(),
				historial.getEstadoAnterior(),
				historial.getEstadoNuevo(),
				historial.getUsuario().getId(),
				historial.getUsuario().getNombre(),
				historial.getMotivo(),
				historial.getDetalle(),
				historial.getFecha());
	}
}
