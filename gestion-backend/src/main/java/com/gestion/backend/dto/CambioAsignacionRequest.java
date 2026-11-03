package com.gestion.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CambioAsignacionRequest(

		@NotNull(message = "La entidad es obligatoria")
		Integer entidadId,

		@Size(max = 500, message = "El motivo no puede superar 500 caracteres")
		String motivo) {
}
