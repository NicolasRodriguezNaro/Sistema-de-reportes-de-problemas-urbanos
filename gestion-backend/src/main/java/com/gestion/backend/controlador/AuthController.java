package com.gestion.backend.controlador;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gestion.backend.dto.CaptchaResponse;
import com.gestion.backend.dto.LoginRequest;
import com.gestion.backend.dto.MensajeResponse;
import com.gestion.backend.dto.RecuperacionConfirmacionRequest;
import com.gestion.backend.dto.RecuperacionSolicitudRequest;
import com.gestion.backend.dto.RegistroRequest;
import com.gestion.backend.dto.TokenResponse;
import com.gestion.backend.dto.UsuarioResumen;
import com.gestion.backend.servicio.RecuperacionPasswordService;
import com.gestion.backend.servicio.ServicioAutenticacion;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final ServicioAutenticacion servicioAutenticacion;
	private final RecuperacionPasswordService recuperacionPasswordService;

	public AuthController(ServicioAutenticacion servicioAutenticacion,
			RecuperacionPasswordService recuperacionPasswordService) {
		this.servicioAutenticacion = servicioAutenticacion;
		this.recuperacionPasswordService = recuperacionPasswordService;
	}

	@PostMapping("/registro")
	public ResponseEntity<TokenResponse> registrar(@Valid @RequestBody RegistroRequest solicitud) {
		return ResponseEntity.status(HttpStatus.CREATED).body(servicioAutenticacion.registrar(solicitud));
	}

	@GetMapping("/captcha")
	public CaptchaResponse captcha() {
		return servicioAutenticacion.generarCaptcha();
	}

	@PostMapping("/login")
	public TokenResponse login(@Valid @RequestBody LoginRequest solicitud) {
		return servicioAutenticacion.login(solicitud);
	}

	@GetMapping("/yo")
	public UsuarioResumen yo() {
		return servicioAutenticacion.actual();
	}

	@PostMapping("/recuperacion")
	public MensajeResponse solicitarRecuperacion(
			@Valid @RequestBody RecuperacionSolicitudRequest solicitud) {
		recuperacionPasswordService.solicitar(solicitud.email(), solicitud.captchaId(),
				solicitud.captchaRespuesta());
		return new MensajeResponse(
				"Si el correo está registrado, recibirás un código de recuperación.");
	}

	@PostMapping("/recuperacion/confirmar")
	public MensajeResponse confirmarRecuperacion(
			@Valid @RequestBody RecuperacionConfirmacionRequest solicitud) {
		recuperacionPasswordService.confirmar(solicitud.email(), solicitud.codigo(),
				solicitud.nuevaPassword());
		return new MensajeResponse("Contraseña actualizada correctamente.");
	}
}
