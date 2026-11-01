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

import com.gestion.backend.dto.FuncionarioActualizacionRequest;
import com.gestion.backend.dto.FuncionarioCreacionRequest;
import com.gestion.backend.dto.PaginaResponse;
import com.gestion.backend.dto.UsuarioGestionResponse;
import com.gestion.backend.servicio.UsuarioEquipoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios/equipo")
@PreAuthorize("hasRole('EMPRESA')")
public class UsuarioEquipoController {

	private final UsuarioEquipoService usuarioEquipoService;

	public UsuarioEquipoController(UsuarioEquipoService usuarioEquipoService) {
		this.usuarioEquipoService = usuarioEquipoService;
	}

	@GetMapping
	public PaginaResponse<UsuarioGestionResponse> listar(
			@RequestParam(required = false) String texto,
			@RequestParam(required = false) Boolean activo,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return usuarioEquipoService.listar(texto, activo, page, size);
	}

	@GetMapping("/{id}")
	public UsuarioGestionResponse obtener(@PathVariable Long id) {
		return usuarioEquipoService.obtener(id);
	}

	@PostMapping
	public ResponseEntity<UsuarioGestionResponse> crear(
			@Valid @RequestBody FuncionarioCreacionRequest solicitud) {
		return ResponseEntity.status(HttpStatus.CREATED).body(usuarioEquipoService.crear(solicitud));
	}

	@PatchMapping("/{id}")
	public UsuarioGestionResponse actualizar(@PathVariable Long id,
			@Valid @RequestBody FuncionarioActualizacionRequest solicitud) {
		return usuarioEquipoService.actualizar(id, solicitud);
	}
}
