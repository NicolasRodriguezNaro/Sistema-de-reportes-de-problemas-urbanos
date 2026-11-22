package com.gestion.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RecuperacionSolicitudRequest(
		@NotBlank(message = "El email es obligatorio")
		@Email(message = "El email no es valido")
		String email,

		@NotBlank(message = "El captcha es obligatorio")
		String captchaId,

		@NotBlank(message = "La respuesta del captcha es obligatoria")
		String captchaRespuesta) {
}
