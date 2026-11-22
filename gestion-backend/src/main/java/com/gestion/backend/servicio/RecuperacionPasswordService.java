package com.gestion.backend.servicio;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.correo.ServicioCorreo;
import com.gestion.backend.dto.RecuperacionCodigoResponse;
import com.gestion.backend.error.CodigoRecuperacionInvalidoException;
import com.gestion.backend.error.RecursoNoEncontradoException;
import com.gestion.backend.modelo.RecuperacionPassword;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.RecuperacionPasswordRepository;
import com.gestion.backend.repositorio.UsuarioRepository;

@Service
public class RecuperacionPasswordService {

	private static final Logger log = LoggerFactory.getLogger(RecuperacionPasswordService.class);
	private static final int MAX_INTENTOS = 5;
	private static final SecureRandom RANDOM = new SecureRandom();

	private final UsuarioRepository usuarioRepository;
	private final RecuperacionPasswordRepository recuperacionRepository;
	private final PasswordEncoder passwordEncoder;
	private final CaptchaService captchaService;
	private final ServicioCorreo servicioCorreo;
	private final long expiracionMinutos;

	public RecuperacionPasswordService(
			UsuarioRepository usuarioRepository,
			RecuperacionPasswordRepository recuperacionRepository,
			PasswordEncoder passwordEncoder,
			CaptchaService captchaService,
			ServicioCorreo servicioCorreo,
			@Value("${gestion.correo.codigo.expiracion-minutos:10}") long expiracionMinutos) {
		this.usuarioRepository = usuarioRepository;
		this.recuperacionRepository = recuperacionRepository;
		this.passwordEncoder = passwordEncoder;
		this.captchaService = captchaService;
		this.servicioCorreo = servicioCorreo;
		this.expiracionMinutos = Math.max(expiracionMinutos, 1);
	}

	@Transactional
	public void solicitar(String email, String captchaId, String captchaRespuesta) {
		captchaService.validar(captchaId, captchaRespuesta);

		Optional<Usuario> encontrado = usuarioRepository.findByEmailIgnoreCase(email.trim())
				.filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()));
		if (encontrado.isEmpty()) {
			return;
		}

		Usuario usuario = encontrado.get();
		CodigoGenerado generado = crearCodigo(usuario);
		try {
			servicioCorreo.enviarCodigoRecuperacion(usuario, generado.codigo(), expiracionMinutos);
		} catch (RuntimeException excepcion) {
			generado.recuperacion().setUsado(true);
			generado.recuperacion().setFechaUso(Instant.now());
			recuperacionRepository.save(generado.recuperacion());
			log.error("No se pudo enviar el código de recuperación a {}", usuario.getEmail(), excepcion);
		}
	}

	@Transactional
	public RecuperacionCodigoResponse generarCodigoManual(Long usuarioId) {
		Usuario usuario = usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado: " + usuarioId));
		if (!Boolean.TRUE.equals(usuario.getActivo())) {
			throw new IllegalArgumentException("El usuario está inactivo");
		}

		CodigoGenerado generado = crearCodigo(usuario);
		return new RecuperacionCodigoResponse(generado.codigo(), expiracionMinutos * 60);
	}

	@Transactional
	public void confirmar(String email, String codigo, String nuevaPassword) {
		if (nuevaPassword == null || nuevaPassword.length() < 8 || nuevaPassword.length() > 72) {
			throw new IllegalArgumentException("La contraseña debe tener entre 8 y 72 caracteres");
		}

		Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email.trim())
				.filter(cuenta -> Boolean.TRUE.equals(cuenta.getActivo()))
				.orElseThrow(CodigoRecuperacionInvalidoException::new);

		RecuperacionPassword recuperacion = recuperacionRepository
				.findFirstByUsuarioIdAndUsadoFalseOrderByFechaCreacionDesc(usuario.getId())
				.orElseThrow(CodigoRecuperacionInvalidoException::new);

		Instant ahora = Instant.now();
		if (recuperacion.isUsado()
				|| !recuperacion.getExpira().isAfter(ahora)
				|| recuperacion.getIntentos() >= MAX_INTENTOS) {
			throw new CodigoRecuperacionInvalidoException();
		}

		if (!passwordEncoder.matches(codigo.trim(), recuperacion.getCodigoHash())) {
			recuperacion.setIntentos(recuperacion.getIntentos() + 1);
			if (recuperacion.getIntentos() >= MAX_INTENTOS) {
				recuperacion.setUsado(true);
				recuperacion.setFechaUso(ahora);
			}
			recuperacionRepository.save(recuperacion);
			throw new CodigoRecuperacionInvalidoException();
		}

		usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
		usuario.setPasswordVersion(usuario.getPasswordVersion() + 1);
		usuarioRepository.save(usuario);

		List<RecuperacionPassword> abiertas = recuperacionRepository.findByUsuarioIdAndUsadoFalse(usuario.getId());
		for (RecuperacionPassword abierta : abiertas) {
			abierta.setUsado(true);
			abierta.setFechaUso(ahora);
		}
		recuperacionRepository.saveAll(abiertas);
	}

	private CodigoGenerado crearCodigo(Usuario usuario) {
		List<RecuperacionPassword> anteriores = recuperacionRepository
				.findByUsuarioIdAndUsadoFalse(usuario.getId());
		Instant ahora = Instant.now();
		for (RecuperacionPassword anterior : anteriores) {
			anterior.setUsado(true);
			anterior.setFechaUso(ahora);
		}
		recuperacionRepository.saveAll(anteriores);

		String codigo = String.format("%06d", RANDOM.nextInt(1_000_000));
		RecuperacionPassword recuperacion = new RecuperacionPassword();
		recuperacion.setUsuario(usuario);
		recuperacion.setCodigoHash(passwordEncoder.encode(codigo));
		recuperacion.setFechaCreacion(ahora);
		recuperacion.setExpira(ahora.plus(expiracionMinutos, ChronoUnit.MINUTES));
		recuperacion.setUsado(false);
		recuperacion.setIntentos(0);
		return new CodigoGenerado(recuperacionRepository.save(recuperacion), codigo);
	}

	private record CodigoGenerado(RecuperacionPassword recuperacion, String codigo) {
	}
}
