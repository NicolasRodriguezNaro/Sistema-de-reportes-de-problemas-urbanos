package com.gestion.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FuncionarioActualizacionRequest(

		@NotBlank(message = "El nombre es obligatorio")
		@Size(max = 150, message = "El nombre no puede superar 150 caracteres")
		String nombre,

		@NotNull(message = "El estado activo es obligatorio")
		Boolean activo) {
}
