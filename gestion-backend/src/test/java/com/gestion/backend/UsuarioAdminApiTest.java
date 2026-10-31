package com.gestion.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.modelo.Entidad;
import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.EntidadRepository;
import com.gestion.backend.repositorio.UsuarioRepository;
import com.gestion.backend.seguridad.ServicioTokens;

@SpringBootTest(properties = {
		"gestion.semantica.ruta-tdb=target/jena-test-web",
		"gestion.almacenamiento.ruta-local=target/uploads-test-web" })
@AutoConfigureMockMvc
@Transactional
class UsuarioAdminApiTest {

	private static final String PASSWORD = "Password123";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private EntidadRepository entidadRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private ServicioTokens servicioTokens;

	private String emailUnico() {
		return "usuarios." + UUID.randomUUID() + "@test.local";
	}

	private Usuario crearUsuario(RolUsuario rol, Entidad entidad, boolean activo) {
		Usuario usuario = new Usuario();
		usuario.setNombre("Usuario " + rol);
		usuario.setEmail(emailUnico());
		usuario.setPasswordHash(passwordEncoder.encode(PASSWORD));
		usuario.setRol(rol);
		usuario.setEntidad(entidad);
		usuario.setActivo(activo);
		usuario.setFechaRegistro(Instant.now());
		return usuarioRepository.saveAndFlush(usuario);
	}

	private String autorizacion(Usuario usuario) {
		return "Bearer " + servicioTokens.generar(usuario).token();
	}

	private String crearJson(String email, RolUsuario rol, Integer entidadId) {
		return """
				{
				  "nombre": "Usuario Nuevo",
				  "email": "%s",
				  "password": "%s",
				  "rol": "%s",
				  "entidadId": %s
				}
				""".formatted(email, PASSWORD, rol, entidadId == null ? "null" : entidadId);
	}

	@Test
	void administradorCreaFuncionarioConEntidad() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null, true);
		Entidad entidad = entidadRepository.findAll().get(0);
		String email = emailUnico();

		mockMvc.perform(post("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(email, RolUsuario.FUNCIONARIO, entidad.getId())))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.email").value(email))
				.andExpect(jsonPath("$.rol").value("FUNCIONARIO"))
				.andExpect(jsonPath("$.entidadId").value(entidad.getId()))
				.andExpect(jsonPath("$.activo").value(true));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(email, PASSWORD)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.usuario.rol").value("FUNCIONARIO"));
	}

	@Test
	void funcionarioNoPuedeGestionarUsuarios() throws Exception {
		Entidad entidad = entidadRepository.findAll().get(0);
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidad, true);

		mockMvc.perform(get("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario)))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(emailUnico(), RolUsuario.FUNCIONARIO, entidad.getId())))
				.andExpect(status().isForbidden());
	}

	@Test
	void funcionarioSinEntidadEsRechazado() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null, true);

		mockMvc.perform(post("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(emailUnico(), RolUsuario.FUNCIONARIO, null)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void administradorNoPuedeTenerEntidad() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null, true);
		Entidad entidad = entidadRepository.findAll().get(0);

		mockMvc.perform(post("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(emailUnico(), RolUsuario.ADMINISTRADOR, entidad.getId())))
				.andExpect(status().isBadRequest());
	}

	@Test
	void emailDuplicadoEsRechazado() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null, true);
		Entidad entidad = entidadRepository.findAll().get(0);
		String email = emailUnico();

		mockMvc.perform(post("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(email, RolUsuario.FUNCIONARIO, entidad.getId())))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/usuarios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(email, RolUsuario.FUNCIONARIO, entidad.getId())))
				.andExpect(status().isBadRequest());
	}

	@Test
	void usuarioDesactivadoNoPuedeIniciarSesionNiUsarTokenAnterior() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null, true);
		Entidad entidad = entidadRepository.findAll().get(0);
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidad, true);
		String autorizacionFuncionario = autorizacion(funcionario);

		mockMvc.perform(patch("/api/usuarios/" + funcionario.getId())
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "nombre": "Usuario Desactivado",
						  "rol": "FUNCIONARIO",
						  "entidadId": %d,
						  "activo": false
						}
						""".formatted(entidad.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.activo").value(false));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(funcionario.getEmail(), PASSWORD)))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(get("/api/auth/yo")
				.header(HttpHeaders.AUTHORIZATION, autorizacionFuncionario))
				.andExpect(status().isForbidden());
	}

	@Test
	void administradorNoPuedeCambiarSuPropioRol() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null, true);
		Entidad entidad = entidadRepository.findAll().get(0);

		mockMvc.perform(patch("/api/usuarios/" + admin.getId())
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "nombre": "Intento de cambio",
						  "rol": "FUNCIONARIO",
						  "entidadId": %d,
						  "activo": true
						}
						""".formatted(entidad.getId())))
				.andExpect(status().isBadRequest());
	}
}
