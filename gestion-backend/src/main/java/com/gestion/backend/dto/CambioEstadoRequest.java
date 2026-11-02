package com.gestion.backend.dto;

import com.gestion.backend.modelo.EstadoReporte;
import com.gestion.backend.modelo.MotivoRechazo;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioEstadoRequest(

		@NotNull(message = "El estado es obligatorio")
		EstadoReporte estado,

		MotivoRechazo motivoRechazo,

		@Size(max = 1000, message = "El detalle no puede superar 1000 caracteres")
		String detalleRechazo) {
}
