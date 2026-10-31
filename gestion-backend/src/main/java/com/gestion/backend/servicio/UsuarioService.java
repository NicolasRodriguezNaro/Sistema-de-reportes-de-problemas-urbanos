package com.gestion.backend.servicio;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.dto.PaginaResponse;
import com.gestion.backend.dto.UsuarioActualizacionRequest;
import com.gestion.backend.dto.UsuarioCreacionRequest;
import com.gestion.backend.dto.UsuarioGestionResponse;
import com.gestion.backend.error.RecursoNoEncontradoException;
import com.gestion.backend.modelo.Entidad;
import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.EntidadRepository;
import com.gestion.backend.repositorio.UsuarioRepository;
import com.gestion.backend.seguridad.ServicioUsuarioActual;

import jakarta.persistence.criteria.Predicate;

@Service
public class UsuarioService {

	private final UsuarioRepository usuarioRepository;
	private final EntidadRepository entidadRepository;
	private final PasswordEncoder passwordEncoder;
	private final ServicioUsuarioActual servicioUsuarioActual;

	public UsuarioService(UsuarioRepository usuarioRepository, EntidadRepository entidadRepository,
			PasswordEncoder passwordEncoder, ServicioUsuarioActual servicioUsuarioActual) {
		this.usuarioRepository = usuarioRepository;
		this.entidadRepository = entidadRepository;
		this.passwordEncoder = passwordEncoder;
		this.servicioUsuarioActual = servicioUsuarioActual;
	}

	@Transactional(readOnly = true)
	public PaginaResponse<UsuarioGestionResponse> listar(RolUsuario rol, Integer entidadId, String texto,
			Boolean activo, int pagina, int tamano) {
		Pageable pageable = pagina(pagina, tamano);
		Specification<Usuario> especificacion = (root, query, cb) -> {
			List<Predicate> condiciones = new ArrayList<>();

			if (rol != null) {
				condiciones.add(cb.equal(root.get("rol"), rol));
			}
			if (entidadId != null) {
				condiciones.add(cb.equal(root.get("entidad").get("id"), entidadId));
			}
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

		Page<Usuario> resultado = usuarioRepository.findAll(especificacion, pageable);
		List<UsuarioGestionResponse> contenido = resultado.getContent().stream()
				.map(UsuarioGestionResponse::desde)
				.toList();

		return new PaginaResponse<>(contenido, resultado.getNumber(), resultado.getSize(),
				resultado.getTotalElements(), resultado.getTotalPages());
	}

	@Transactional(readOnly = true)
	public UsuarioGestionResponse obtener(Long id) {
		return UsuarioGestionResponse.desde(buscar(id));
	}

	@Transactional
	public UsuarioGestionResponse crear(UsuarioCreacionRequest solicitud) {
		String email = solicitud.email().trim().toLowerCase();
		if (usuarioRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Ya existe un usuario registrado con ese email");
		}

		Entidad entidad = resolverEntidad(solicitud.rol(), solicitud.entidadId());

		Usuario usuario = new Usuario();
		usuario.setNombre(solicitud.nombre().trim());
		usuario.setEmail(email);
		usuario.setPasswordHash(passwordEncoder.encode(solicitud.password()));
		usuario.setRol(solicitud.rol());
		usuario.setEntidad(entidad);
		usuario.setActivo(true);
		usuario.setFechaRegistro(Instant.now());

		return UsuarioGestionResponse.desde(usuarioRepository.save(usuario));
	}

	@Transactional
	public UsuarioGestionResponse actualizar(Long id, UsuarioActualizacionRequest solicitud) {
		Usuario usuario = buscar(id);
		Usuario actual = servicioUsuarioActual.actual();

		boolean esUsuarioActual = usuario.getId().equals(actual.getId());
		if (esUsuarioActual && usuario.getRol() != solicitud.rol()) {
			throw new IllegalArgumentException("No puedes cambiar tu propio rol");
		}
		if (esUsuarioActual && !Boolean.TRUE.equals(solicitud.activo())) {
			throw new IllegalArgumentException("No puedes desactivar tu propia cuenta");
		}

		boolean eraAdminActivo = usuario.getRol() == RolUsuario.ADMINISTRADOR
				&& Boolean.TRUE.equals(usuario.getActivo());
		boolean dejaDeSerAdminActivo = solicitud.rol() != RolUsuario.ADMINISTRADOR
				|| !Boolean.TRUE.equals(solicitud.activo());
		if (eraAdminActivo && dejaDeSerAdminActivo
				&& usuarioRepository.countByRolAndActivoTrue(RolUsuario.ADMINISTRADOR) <= 1) {
			throw new IllegalArgumentException("No se puede desactivar ni cambiar el rol del ultimo administrador activo");
		}

		Entidad entidad = resolverEntidad(solicitud.rol(), solicitud.entidadId());

		usuario.setNombre(solicitud.nombre().trim());
		usuario.setRol(solicitud.rol());
		usuario.setEntidad(entidad);
		usuario.setActivo(solicitud.activo());

		return UsuarioGestionResponse.desde(usuarioRepository.save(usuario));
	}

	private Pageable pagina(int pagina, int tamano) {
		int paginaSegura = Math.max(pagina, 0);
		int tamanoSeguro = Math.min(Math.max(tamano, 1), 100);
		return PageRequest.of(paginaSegura, tamanoSeguro, Sort.by("nombre").ascending());
	}

	private Usuario buscar(Long id) {
		return usuarioRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado: " + id));
	}

	private Entidad resolverEntidad(RolUsuario rol, Integer entidadId) {
		boolean requiereEntidad = rol == RolUsuario.FUNCIONARIO || rol == RolUsuario.EMPRESA;

		if (requiereEntidad && entidadId == null) {
			throw new IllegalArgumentException("El rol " + rol + " debe tener una entidad asignada");
		}
		if (!requiereEntidad && entidadId != null) {
			throw new IllegalArgumentException("El rol " + rol + " no debe tener una entidad asignada");
		}
		if (!requiereEntidad) {
			return null;
		}

		return entidadRepository.findById(entidadId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Entidad no encontrada: " + entidadId));
	}
}
