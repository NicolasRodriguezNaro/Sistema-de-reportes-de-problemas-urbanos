package com.gestion.backend.error;

public class CaptchaInvalidoException extends RuntimeException {

	public CaptchaInvalidoException() {
		super("El captcha es invalido o expiro. Actualiza la imagen e intenta de nuevo.");
	}
}
