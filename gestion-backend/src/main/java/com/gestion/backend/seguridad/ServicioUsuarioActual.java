package com.gestion.backend.seguridad;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.gestion.backend.error.RecursoNoEncontradoException;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.UsuarioRepository;

@Component
public class ServicioUsuarioActual {

	private final UsuarioRepository usuarioRepository;

	public ServicioUsuarioActual(UsuarioRepository usuarioRepository) {
		this.usuarioRepository = usuarioRepository;
	}

	public Usuario actual() {
		Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
		if (!(autenticacion instanceof JwtAuthenticationToken jwt)) {
			throw new IllegalStateException("No hay un usuario autenticado en el contexto de seguridad");
		}

		Long id = Long.valueOf(jwt.getToken().getSubject());
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario autenticado no encontrado: " + id));
		if (!Boolean.TRUE.equals(usuario.getActivo())) {
			throw new AccessDeniedException("El usuario esta inactivo");
		}

		Object versionToken = jwt.getToken().getClaim("version");
		int version = versionToken instanceof Number numero ? numero.intValue() : 0;
		if (version != usuario.getPasswordVersion()) {
			throw new AccessDeniedException("La sesión ya no es válida. Inicia sesión nuevamente.");
		}

		return usuario;
	}
}
