package com.gestion.backend.dto;

import java.time.Instant;

import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Usuario;

public record UsuarioGestionResponse(
		Long id,
		String nombre,
		String email,
		RolUsuario rol,
		Integer entidadId,
		String entidadNombre,
		boolean activo,
		Instant fechaRegistro) {

	public static UsuarioGestionResponse desde(Usuario usuario) {
		return new UsuarioGestionResponse(
				usuario.getId(),
				usuario.getNombre(),
				usuario.getEmail(),
				usuario.getRol(),
				usuario.getEntidad() != null ? usuario.getEntidad().getId() : null,
				usuario.getEntidad() != null ? usuario.getEntidad().getNombre() : null,
				Boolean.TRUE.equals(usuario.getActivo()),
				usuario.getFechaRegistro());
	}
}
