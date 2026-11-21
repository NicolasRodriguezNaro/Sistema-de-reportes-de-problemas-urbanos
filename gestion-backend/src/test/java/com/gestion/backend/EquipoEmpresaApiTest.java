package com.gestion.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
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

import com.gestion.backend.modelo.Entidad;
import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.EntidadRepository;
import com.gestion.backend.repositorio.UsuarioRepository;
import com.gestion.backend.seguridad.ServicioTokens;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest(properties = {
		"gestion.semantica.ruta-tdb=target/jena-test-web",
		"gestion.almacenamiento.ruta-local=target/uploads-test-web",
		"gestion.seguridad.captcha.activo=false" })
@AutoConfigureMockMvc
@Transactional
class EquipoEmpresaApiTest {

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
		return "equipo." + UUID.randomUUID() + "@test.local";
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

	private String crearJson(String email) {
		return """
				{
				  "nombre": "Funcionario Nuevo",
				  "email": "%s",
				  "password": "%s"
				}
				""".formatted(email, PASSWORD);
	}

	@Test
	void empresaCreaFuncionarioEnSuEntidadYFuerzaElRol() throws Exception {
		List<Entidad> entidades = entidadRepository.findAll();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);
		Usuario empresa = crearUsuario(RolUsuario.EMPRESA, entidadA, true);
		String email = emailUnico();

		mockMvc.perform(post("/api/usuarios/equipo")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresa))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(email)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.rol").value("FUNCIONARIO"))
				.andExpect(jsonPath("$.entidadId").value(entidadA.getId()))
				.andExpect(jsonPath("$.activo").value(true));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(email, PASSWORD)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.usuario.rol").value("FUNCIONARIO"))
				.andExpect(jsonPath("$.usuario.entidadId").value(entidadA.getId()));
	}

	@Test
	void empresaSoloVeYEditaFuncionariosDeSuEntidad() throws Exception {
		List<Entidad> entidades = entidadRepository.findAll();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario empresaA = crearUsuario(RolUsuario.EMPRESA, entidadA, true);
		Usuario funcionarioA = crearUsuario(RolUsuario.FUNCIONARIO, entidadA, true);
		Usuario funcionarioB = crearUsuario(RolUsuario.FUNCIONARIO, entidadB, true);

		MvcResult listado = mockMvc.perform(get("/api/usuarios/equipo")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresaA)))
				.andExpect(status().isOk())
				.andReturn();

		List<String> emails = JsonPath.read(listado.getResponse().getContentAsString(), "$.contenido[*].email");
		assertThat(emails).contains(funcionarioA.getEmail());
		assertThat(emails).doesNotContain(funcionarioB.getEmail());

		mockMvc.perform(patch("/api/usuarios/equipo/" + funcionarioB.getId())
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresaA))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "nombre": "Intento", "activo": false }
						"""))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/usuarios/equipo/" + funcionarioA.getId())
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresaA))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "nombre": "Funcionario Actualizado", "activo": true }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nombre").value("Funcionario Actualizado"));
	}

	@Test
	void funcionarioNoPuedeAccederAlEquipo() throws Exception {
		Entidad entidad = entidadRepository.findAll().get(0);
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidad, true);

		mockMvc.perform(get("/api/usuarios/equipo")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario)))
				.andExpect(status().isForbidden());
	}

	@Test
	void empresaSinEntidadNoPuedeGestionarEquipo() throws Exception {
		Usuario empresa = crearUsuario(RolUsuario.EMPRESA, null, true);

		mockMvc.perform(get("/api/usuarios/equipo")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresa)))
				.andExpect(status().isForbidden());
	}

	@Test
	void emailDuplicadoEsRechazado() throws Exception {
		Entidad entidad = entidadRepository.findAll().get(0);
		Usuario empresa = crearUsuario(RolUsuario.EMPRESA, entidad, true);
		Usuario existente = crearUsuario(RolUsuario.CIUDADANO, null, true);

		mockMvc.perform(post("/api/usuarios/equipo")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresa))
				.contentType(MediaType.APPLICATION_JSON)
				.content(crearJson(existente.getEmail())))
				.andExpect(status().isBadRequest());
	}
}
