package com.gestion.backend.controlador;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gestion.backend.dto.PaginaResponse;
import com.gestion.backend.dto.UsuarioActualizacionRequest;
import com.gestion.backend.dto.UsuarioCreacionRequest;
import com.gestion.backend.dto.UsuarioGestionResponse;
import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.servicio.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UsuarioController {

	private final UsuarioService usuarioService;

	public UsuarioController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}

	@GetMapping
	public PaginaResponse<UsuarioGestionResponse> listar(
			@RequestParam(required = false) RolUsuario rol,
			@RequestParam(required = false) Integer entidadId,
			@RequestParam(required = false) String texto,
			@RequestParam(required = false) Boolean activo,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return usuarioService.listar(rol, entidadId, texto, activo, page, size);
	}

	@GetMapping("/{id}")
	public UsuarioGestionResponse obtener(@PathVariable Long id) {
		return usuarioService.obtener(id);
	}

	@PostMapping
	public ResponseEntity<UsuarioGestionResponse> crear(@Valid @RequestBody UsuarioCreacionRequest solicitud) {
		return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(solicitud));
	}

	@PatchMapping("/{id}")
	public UsuarioGestionResponse actualizar(@PathVariable Long id,
			@Valid @RequestBody UsuarioActualizacionRequest solicitud) {
		return usuarioService.actualizar(id, solicitud);
	}
}
