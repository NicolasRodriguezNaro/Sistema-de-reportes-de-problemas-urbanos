package com.gestion.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecuperacionConfirmacionRequest(
		@NotBlank(message = "El email es obligatorio")
		@Email(message = "El email no es valido")
		String email,

		@NotBlank(message = "El codigo es obligatorio")
		String codigo,

		@NotBlank(message = "La nueva contrasena es obligatoria")
		@Size(min = 8, max = 72, message = "La contrasena debe tener entre 8 y 72 caracteres")
		String nuevaPassword) {
}
