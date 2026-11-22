package com.gestion.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.UsuarioRepository;
import com.gestion.backend.seguridad.ServicioTokens;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest(properties = {
		"gestion.semantica.ruta-tdb=target/jena-test-recuperacion",
		"gestion.almacenamiento.ruta-local=target/uploads-test-recuperacion",
		"gestion.seguridad.captcha.activo=false",
		"gestion.correo.proveedor=log" })
@AutoConfigureMockMvc
@Transactional
class RecuperacionPasswordApiTest {

	private static final String PASSWORD = "Password123";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private ServicioTokens servicioTokens;

	private Usuario crearUsuario(RolUsuario rol) {
		Usuario usuario = new Usuario();
		usuario.setNombre("Usuario " + rol);
		usuario.setEmail("recuperacion." + UUID.randomUUID() + "@test.local");
		usuario.setPasswordHash(passwordEncoder.encode(PASSWORD));
		usuario.setRol(rol);
		usuario.setActivo(true);
		usuario.setFechaRegistro(Instant.now());
		return usuarioRepository.saveAndFlush(usuario);
	}

	private String autorizacion(Usuario usuario) {
		return "Bearer " + servicioTokens.generar(usuario).token();
	}

	@Test
	void administradorGeneraCodigoYUsuarioCambiaPassword() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO);
		String tokenAnterior = autorizacion(ciudadano);

		MvcResult generacion = mockMvc.perform(post("/api/usuarios/" + ciudadano.getId() + "/recuperacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.codigo").isNotEmpty())
				.andExpect(jsonPath("$.expiraEnSegundos").value(600))
				.andReturn();

		String codigo = JsonPath.read(generacion.getResponse().getContentAsString(), "$.codigo");
		assertThat(codigo).matches("\\d{6}");

		mockMvc.perform(post("/api/auth/recuperacion/confirmar")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "codigo": "%s", "nuevaPassword": "NuevaPassword123" }
						""".formatted(ciudadano.getEmail(), codigo)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.mensaje").value("Contraseña actualizada correctamente."));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "NuevaPassword123" }
						""".formatted(ciudadano.getEmail())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").isNotEmpty());

		mockMvc.perform(get("/api/auth/yo")
				.header(HttpHeaders.AUTHORIZATION, tokenAnterior))
				.andExpect(status().isForbidden());
	}

	@Test
	void solicitudPublicaRespondeIgualParaCorreoDesconocido() throws Exception {
		mockMvc.perform(post("/api/auth/recuperacion")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "no-existe@test.local", "captchaId": "dummy", "captchaRespuesta": "dummy" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.mensaje")
						.value("Si el correo está registrado, recibirás un código de recuperación."));
	}

	@Test
	void funcionarioNoPuedeGenerarCodigoManual() throws Exception {
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO);

		mockMvc.perform(post("/api/usuarios/" + ciudadano.getId() + "/recuperacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario)))
				.andExpect(status().isForbidden());
	}

	@Test
	void codigoIncorrectoEsRechazado() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO);

		mockMvc.perform(post("/api/usuarios/" + ciudadano.getId() + "/recuperacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/auth/recuperacion/confirmar")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "codigo": "000000", "nuevaPassword": "NuevaPassword123" }
						""".formatted(ciudadano.getEmail())))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Código inválido"));
	}
}
