package com.gestion.backend.servicio;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.dto.FuncionarioActualizacionRequest;
import com.gestion.backend.dto.FuncionarioCreacionRequest;
import com.gestion.backend.dto.PaginaResponse;
import com.gestion.backend.dto.UsuarioGestionResponse;
import com.gestion.backend.error.RecursoNoEncontradoException;
import com.gestion.backend.modelo.Entidad;
import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.UsuarioRepository;
import com.gestion.backend.seguridad.ServicioUsuarioActual;

import jakarta.persistence.criteria.Predicate;

@Service
public class UsuarioEquipoService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final ServicioUsuarioActual servicioUsuarioActual;

	public UsuarioEquipoService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
			ServicioUsuarioActual servicioUsuarioActual) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.servicioUsuarioActual = servicioUsuarioActual;
	}

	@Transactional(readOnly = true)
	public PaginaResponse<UsuarioGestionResponse> listar(String texto, Boolean activo, int pagina, int tamano) {
		Entidad entidad = entidadDeEmpresa();

		Specification<Usuario> especificacion = (root, query, cb) -> {
			List<Predicate> condiciones = new ArrayList<>();
			condiciones.add(cb.equal(root.get("rol"), RolUsuario.FUNCIONARIO));
			condiciones.add(cb.equal(root.get("entidad").get("id"), entidad.getId()));
			if (activo != null) {
				condiciones.add(cb.equal(root.get("activo"), activo));
			}
			if (texto != null && !texto.isBlank()) {
				String patron = "%" + texto.trim().toLowerCase() + "%";
				condiciones.add(cb.or(
						cb.like(cb.lower(root.get("nombre")), patron),
						cb.like(cb.lower(root.get("email")), patron)));
			}
			return cb.and(condiciones.toArray(Predicate[]::new));
		};

		Page<Usuario> resultado = usuarioRepository.findAll(especificacion, pagina(pagina, tamano));
		List<UsuarioGestionResponse> contenido = resultado.getContent().stream()
				.map(UsuarioGestionResponse::desde)
				.toList();

		return new PaginaResponse<>(contenido, resultado.getNumber(), resultado.getSize(),
				resultado.getTotalElements(), resultado.getTotalPages());
	}

	@Transactional(readOnly = true)
	public UsuarioGestionResponse obtener(Long id) {
		return UsuarioGestionResponse.desde(buscarFuncionario(id, entidadDeEmpresa()));
	}

	@Transactional
	public UsuarioGestionResponse crear(FuncionarioCreacionRequest solicitud) {
		Entidad entidad = entidadDeEmpresa();
		String email = solicitud.email().trim().toLowerCase();

		if (usuarioRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Ya existe un usuario registrado con ese email");
		}

		Usuario usuario = new Usuario();
		usuario.setNombre(solicitud.nombre().trim());
		usuario.setEmail(email);
		usuario.setPasswordHash(passwordEncoder.encode(solicitud.password()));
		usuario.setRol(RolUsuario.FUNCIONARIO);
		usuario.setEntidad(entidad);
		usuario.setActivo(true);
		usuario.setFechaRegistro(Instant.now());

		return UsuarioGestionResponse.desde(usuarioRepository.save(usuario));
	}

	@Transactional
	public UsuarioGestionResponse actualizar(Long id, FuncionarioActualizacionRequest solicitud) {
		Usuario usuario = buscarFuncionario(id, entidadDeEmpresa());

		usuario.setNombre(solicitud.nombre().trim());
		usuario.setActivo(solicitud.activo());

		return UsuarioGestionResponse.desde(usuarioRepository.save(usuario));
	}

	private Entidad entidadDeEmpresa() {
		Usuario actual = servicioUsuarioActual.actual();
		if (actual.getRol() != RolUsuario.EMPRESA) {
			throw new AccessDeniedException("Solo una empresa puede gestionar su equipo");
		}
		if (actual.getEntidad() == null) {
			throw new AccessDeniedException("El usuario EMPRESA no tiene una entidad asignada");
		}
		return actual.getEntidad();
	}

	private Usuario buscarFuncionario(Long id, Entidad entidad) {
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado: " + id));

		if (usuario.getRol() != RolUsuario.FUNCIONARIO
				|| usuario.getEntidad() == null
				|| !entidad.getId().equals(usuario.getEntidad().getId())) {
			throw new AccessDeniedException("El usuario no pertenece a su entidad");
		}
		return usuario;
	}

	private Pageable pagina(int pagina, int tamano) {
		int paginaSegura = Math.max(pagina, 0);
		int tamanoSeguro = Math.min(Math.max(tamano, 1), 100);
		return PageRequest.of(paginaSegura, tamanoSeguro, Sort.by("nombre").ascending());
	}
}
