package com.gestion.backend.error;

public class CodigoRecuperacionInvalidoException extends RuntimeException {

	public CodigoRecuperacionInvalidoException() {
		super("El código de recuperación es inválido o expiró.");
	}
}
