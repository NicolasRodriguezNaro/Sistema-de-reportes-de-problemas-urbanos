package com.gestion.backend.dto;

import com.gestion.backend.modelo.RolUsuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioActualizacionRequest(

		@NotBlank(message = "El nombre es obligatorio")
		@Size(max = 150, message = "El nombre no puede superar 150 caracteres")
		String nombre,

		@NotNull(message = "El rol es obligatorio")
		RolUsuario rol,

		Integer entidadId,

		@NotNull(message = "El estado activo es obligatorio")
		Boolean activo) {
}
